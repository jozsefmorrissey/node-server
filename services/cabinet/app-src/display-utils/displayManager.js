


const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const CustomEvent = require('../../../../public/js/utils/custom-event.js');

class DisplayManager {
  constructor(displayId, listId, switchId, selected) {
    if (switchId && !listId) throw new Error('switchId can be defined iff listId is defined');
    const switchCntId = String.random();
    const instance = this;
    this.list = (func) => {
      const list = [];
      const runFunc = (typeof func) === 'function';
      const displayElems = du.id(displayId).children;
      for (let index = 0; index < displayElems.length; index += 1) {
        const elem = displayElems[index];
        let name = elem.getAttribute('name');
        if (name) {
          let id = elem.id || String.random();
          elem.id = id;
          const item = {id, name, link: elem.getAttribute('link')};
          if (runFunc) func(elem);
          list.push(item);
        }
      }
      return list;
    }

    let lastActivated;
    function updateActive(id) {
      const switchCnt = du.id(switchCntId);
      if (switchCnt) {
        const items = switchCnt.children;
        for (let index = 0; index < items.length; index += 1) {
          const elem = du.find.down('button', items[index]);
          if (elem) {
            if (elem.getAttribute('display-id') === id) {
              du.class.add(elem, 'active');
              const target = du.id(id);
              switchEvent.trigger({from: lastActivated, to: target});
              lastActivated = target;
            } else {
              du.class.remove(elem, 'active');
            }
          }
        }
      }
    }

    const switchEvent = new CustomEvent('switch');
    this.onSwitch = switchEvent.on;

    function open(id) {
      if (!lastActivated || id !== lastActivated.id);
      const displayElems = du.id(displayId).children;
      for (let index = 0; index < displayElems.length; index += 1) {
        const elem = displayElems[index];
        if (elem.id === id) {
          const link = elem.getAttribute('link');
          if (link) {
            window.location.href = link;
            return;
          }
          elem.hidden = false;
        }
        else elem.hidden = true;
      }
      updateActive(id);
    }

    this.open = open;

    const children = du.id(displayId).children;

    if (switchId) {
      du.on.match('click', `#${switchId}`, (target, event) => {
        const listElem = du.id(listId);
        listElem.hidden = !listElem.hidden;
      });
      document.addEventListener('click', (event) => {
        const listElem = du.id(listId);
        const target = event.target;
        const withinList = du.find.up(`#${listId}`, target) !== undefined;
        if (!withinList && target.id !== switchId &&listElem)
          listElem.hidden = true;
      });
    }
    DisplayManager.instances[switchCntId] = this
    if ((typeof selected) === 'string') setTimeout(() => open(selected), 100);
    else if (children.length > 0) {
      this.list();
      open(children[0].id);
    }
    if (listId) {
      du.id(listId).innerHTML = DisplayManager.template.render({switchCntId, switchId, list: this.list()});
    }
    this.onSwitch(console.log);
  }
}

DisplayManager.instances = {};
DisplayManager.template = new $t('display-manager');

du.on.match('click', '.display-manager-input', (target, event) => {
  const displayManager = du.find.up('.display-manager', target);
  const displayManagerId = displayManager.id;
  const displayId = target.getAttribute('display-id');
  DisplayManager.instances[displayManagerId].open(displayId);
});
module.exports = DisplayManager
