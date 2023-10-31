
const $t = require('../$t');
const du = require('../dom-utils');
const Lookup = require('../object/lookup');
const CustomEvent = require('../custom-event.js');


class FileTabDisplay extends Lookup {
  constructor() {
    super();
    const list = {};
    let tYpe = 'down';
    let selected;
    this.register = (title, htmlFunc) => {
      list[title] = htmlFunc;
    }
    CustomEvent.all(this, 'change', 'beforeChange', 'close', 'open');
    this.type = (type) => type !== undefined ? (tYpe = type) : tYpe;
    this.selected = (title) => title !== undefined ? (selected = title) : selected;
    this.unregister = (title) => delete list[title];
    this.list = () => Object.keys(list);
    this.update = () => {
      const cnts = du.find.all(`#${this.id()}.open`);
      for (let index = 0; index < cnts.length; index++) {
        const contentCnt = du.find.down('.content', cnts[index]);
        contentCnt.innerHTML = this.selectedHtml();
      }
    }

    this.isOpen = () => list[selected] !== undefined;

    this.selectedHtml = () => list[selected] ? list[selected]() : '';
    this.html = (title) => title === undefined ?
          FileTabDisplay.template.render(this) : list[title]();
  }
}

du.on.match('click', '.file-tab-cnt > ul > li', (elem, event) => {
  event.preventDefault();
  let close = false;
  if (du.class.has(elem, 'selected')) close = true;
  Array.from(elem.parentElement.children)
    .forEach(e => du.class.remove(e, 'selected'));

  const container = du.find.closest('.file-tab-cnt', elem);
  const ftd = FileTabDisplay.get(container.id);
  const from = ftd.selected();
  if (close) {
    ftd.selected(null);
    ftd.trigger.close({from});
    ftd.trigger.change({from});
    return du.class.remove(container, 'open');
  }

  const content = du.find.down('.content', container);
  const to = elem.innerText;
  ftd.selected(to);
  content.innerHTML = ftd.selectedHtml();
  du.class.add(container, 'open');
  du.class.add(elem, 'selected');
  if (from == undefined) ftd.trigger.open({to});
  ftd.trigger.change({from, to});
});

FileTabDisplay.template = new $t('lists/file-tab');

module.exports = FileTabDisplay;
