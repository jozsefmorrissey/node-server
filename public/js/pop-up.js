
const POP_UP = {};
POP_UP.byId = [];
POP_UP.pending = [];
POP_UP.tagName = document.currentScript.getAttribute('tag-name') || 'pop-up';
POP_UP.history = [];

function PopUp() {
  function onOpen(id, func) {
    if ((typeof func) === 'function' || (typeof func === 'string')) {
      POP_UP.byId[id].onOpen.push(func);
    }
  }

  function onClose(id, func) {
    if ((typeof func) === 'function' || (typeof func === 'string')) {
      POP_UP.byId[id].onClose.push(func);
    }
  }

  function runFuncs(id, funcs) {
    for (let index = 0; index < funcs.length; index += 1) {
      const func = funcs[index];
      if ((typeof func) === 'function') {
        func.call(null, id);
      } else if (func.trim().match(/^.*\(.*\)$/)) {
        eval(func);
      } else {
        eval(func + '("' + id + '")');
      }
    }
  }

  function close(e, dontRemove) {
    if (!e || !e.target || e.target.id.match(/^.*-haze$/)) {
      let id;
      if ((typeof e) === 'object') {
        id = e.target.id.replace(/^(.*)-haze/, '$1');
      } else {
        id = e;
      }
      if (!dontRemove) {
        removeFromHistory(id);
      }
      const haze = POP_UP.byId[id].haze;
      if ((POP_UP.byId[id].onClose) === 'function') {
        POP_UP.byId[id].onClose(id);
      }
      haze.style.display = 'none';
      POP_UP.byId[id].open = 0;
      if (!dontRemove && POP_UP.history.length > 0) {
        open(POP_UP.history[POP_UP.history.length - 1].id);
      }
    }
  }

  function open(id) {
    closeAll(true);
    runFuncs(id, POP_UP.byId[id].onOpen);
    document.querySelector('#' + id + '-haze').style.display = 'block';
    POP_UP.byId[id].open = new Date().getTime();
  }

  function create(id, onOpen, onClose) {
    if (POP_UP.afterLoading) {
      buildPopUp(id, onOpen, onClose);
    } else {
      POP_UP.pending.push({id, onOpen, onClose});
    }
  }

  function parsePopUp(elem) {
    const parent = elem.parentNode;
    const onOpen = elem.getAttribute('on-open');
    const onClose = elem.getAttribute('on-close');
    parent.removeChild(elem);
    buildPopUp(elem.id, onOpen, onClose, elem);
  }

  function buildPopUp(id, onOpen, onClose, html) {
    let haze = document.createElement(POP_UP.tagName);
    haze.id = id + '-haze';
    haze.className = 'pop-up-haze';
    haze.onclick = POP_UP.close;
    haze.style.display = 'none';

    if (html) {
      html.className = 'pop-up';
      haze.appendChild(html);
    } else {
      haze.innerHTML = `<div class='pop-up' id='${id}'>${html}</div>`;
    }

    document.body.append(haze);
    POP_UP.byId[id] = { haze, onOpen: [], onClose: [] };
    onOpen && POP_UP.byId[id].onOpen.push(onOpen);
    onClose && POP_UP.byId[id].onClose.push(onClose);
    return haze;
  }

  function onLoad() {
    POP_UP.afterLoading = true;
    const popUps = document.querySelectorAll(POP_UP.tagName);
    for (let index = 0; index < popUps.length; index += 1) {
      parsePopUp(popUps[index]);
    }

    for (let index = 0; index < POP_UP.pending.length; index += 1) {
      const pu = POP_UP.pending[index];
      buildPopUp(pu.id, pu.onOpen, pu.onClose);
    }
  }

  function sortByAttr(attr) {
    function sort(obj1, obj2) {
      if (obj2[attr] === obj1[attr]) {
        return 0;
      }
      return obj2[attr] < obj1[attr] ? 1 : -1;
    }
    return sort;
  }

  function removeFromHistory(id) {
    for (let index = 0; index < POP_UP.history.length; index += 1) {
      if (POP_UP.history[index].id === id) {
        POP_UP.history = POP_UP.history.splice(0, index).concat(
            POP_UP.history.splice(index + 1));
      }
    }
  }

  function closeAll(recordHistory) {
    const ids = Object.keys(POP_UP.byId);
    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const obj = POP_UP.byId[id];
      if (obj.open > 0) {
        if (recordHistory) {
          removeFromHistory(id);
          POP_UP.history.push({id, time: obj.open});
          POP_UP.history.sort(sortByAttr('time'));
        }
        close(id, true);
      }
    }
  }

  POP_UP.create = create;
  POP_UP.open = open;
  POP_UP.close = close;
  POP_UP.onOpen = onOpen;
  POP_UP.onClose = onClose;
  POP_UP.closeAll = closeAll;
  window.addEventListener('load', onLoad);

  style = document.createElement("link");
  style.href = '/styles/pop-up.css';
  style.rel = 'stylesheet';
  document.head.appendChild(style);
}

let count = 0;
function openCount(id) {
  document.getElementById(id).innerHTML = `<h1>Opened ${++count} times: Now in id '${id}'</h1>`;
}

PopUp();
POP_UP.create('myPopUp', openCount);
POP_UP.create('myPopUp2', openCount);
