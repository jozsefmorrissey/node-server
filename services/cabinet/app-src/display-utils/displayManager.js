class DisplayManager {
  constructor(displayId, listId, switchId) {
    if (switchId && !listId) throw new Error('switchId can be defined iff listId is defined');
    const id = randomString();
    const instance = this;
    this.list = (func) => {
      const list = [];
      const runFunc = (typeof func) === 'function';
      const displayElems = document.getElementById(displayId).children;
      for (let index = 0; index < displayElems.length; index += 1) {
        const elem = displayElems[index];
        let id = elem.id || randomString(7);
        elem.id = id;
        name = elem.getAttribute('name') || id;
        const item = {id, name};
        if (runFunc) func(elem);
        list.push(item);
      }
      return list;
    }

    function updateActive(id) {
      const items = document.querySelectorAll('.display-manager-input');
      for (let index = 0; index < items.length; index += 1) {
        const elem = items[index];
        elem.getAttribute('display-id') === id ?
              addClass(elem, 'active') : removeClass(elem, 'active');
      }
    }

    function open(id) {
      const displayElems = document.getElementById(displayId).children;
      for (let index = 0; index < displayElems.length; index += 1) {
        const elem = displayElems[index];
        if (elem.id === id) elem.hidden = false;
        else elem.hidden = true;
      }
      updateActive(id);
    }

    this.open = open;

    const children = document.getElementById(displayId).children;

    if (children.length > 0) {
      this.list();
      open(children[0].id);
      if (listId) {
        document.getElementById(listId).innerHTML = DisplayManager.template.render({id, switchId, list: this.list()});
      }
    }

    if (switchId) {
      matchRun('click', `#${switchId}`, (target, event) => {
        const listElem = document.getElementById(listId);
        listElem.hidden = !listElem.hidden;
      });
      document.addEventListener('click', (event) => {
        const listElem = document.getElementById(listId);
        const target = event.target;
        const withinList = up(`#${listId}`, target) !== undefined;
        if (!withinList && target.id !== switchId &&listElem)
          listElem.hidden = true;
      });
    }
    DisplayManager.instances[id] = this;
  }
}

DisplayManager.instances = {};
DisplayManager.template = new $t('display-manager');

matchRun('click', '.display-manager-input', (target, event) => {
  const displayManager = up('.display-manager', target);
  const displayManagerId = displayManager.id;
  const displayId = target.getAttribute('display-id');
  DisplayManager.instances[displayManagerId].open(displayId);
});
