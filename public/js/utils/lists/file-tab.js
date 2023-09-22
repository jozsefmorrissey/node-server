
const $t = require('../$t');
const du = require('../dom-utils');
const Lookup = require('../object/lookup');

class FileTabDisplay extends Lookup {
  constructor() {
    super();
    const list = {};
    let tYpe = 'down';
    let selected;
    this.register = (title, htmlFunc) => {
      list[title] = htmlFunc;
    }
    this.type = (type) => type !== undefined ? (tYpe = type) : tYpe;
    this.selected = (title) => title !== undefined ? (selected = title) : selected;
    this.unregister = (title) => delete list[title];
    this.list = () => Object.keys(list);
    this.update = () => {
      const contentCnt = du.find.down('.content', du.id(this.id()));
      contentCnt.innerHTML = this.selectedHtml();
    }

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
  if (close) return du.class.remove(container, 'open');

  const content = du.find.closest('.content', elem);
  const ftd = FileTabDisplay.get(container.id);
  ftd.selected(elem.innerText);
  content.innerHTML = ftd.selectedHtml();
  du.class.add(container, 'open')
  du.class.add(elem, 'selected');
});

FileTabDisplay.template = new $t('lists/file-tab');

module.exports = FileTabDisplay;
