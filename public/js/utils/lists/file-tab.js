
const $t = require('../$t');
const du = require('../dom-utils');
const Lookup = require('../object/lookup');
const CustomEvent = require('../custom-event.js');

/**
**/
class FileTabDisplay extends Lookup {
  constructor(props) {
    super();
    props ||= {};
    const list = {};
    let tYpe = 'down';
    let selected;

    const fileTabContainer = (elem) => du.find.closest(`[id='${this.id()}']`, elem);
    const containerSelector = (title) =>
            `[id='${this.id()}'] .content-cnt>[title='${title || selected}']`;
    const contentContainer = (title, elem) =>
            du.find.closest(containerSelector(), elem) || containerSelector();
    this.register = (title, htmlFunc, shouldRender) => {
      shouldRender = shouldRender instanceof Function ? shouldRender : null;
      list[title] = {html: htmlFunc, shouldRender};
      this.trigger.register(title, this);
    }
    CustomEvent.all(this, 'register', 'change', 'beforeChange', 'close', 'open');
    this.type = (type) => type !== undefined ? (tYpe = type) : tYpe;
    this.selected = (title) => {
      if (title !== undefined && title !== selected) {
        selected = title;
      }
      return selected;
    }
    this.build = () =>
      fileTabContainer().innerHTML = this.html();
    this.selected.is = (title) => title === selected;
    this.unregister = (title) => delete list[title];
    this.shouldRender = () => list[selected] && list[selected].shouldRender &&
                              list[selected].shouldRender(contentContainer());
    this.list = () => Object.keys(list);
    this.switch = (to, elem) => {
      let close = false;
      if (this.selected.is(to)) close = true;
      const container = fileTabContainer(elem);
      const list = du.find.down('.list', container);
      const tab = du.find.down(`[title='${to}']`, list)
      const contentCnt = du.find.down('.content-cnt', container);
      Array.from(list.children)
        .forEach(e => du.class.remove(e, 'selected'));
      Array.from(contentCnt.children)
        .forEach(e => du.class.remove(e, 'selected') & du.hide(e));

      const from = this.selected();
      const content = contentContainer(from, container);
      const info = {from, content};
      if (close) {
        this.selected(null);
        this.trigger.beforeChange(info)
        this.trigger.close(info);
        this.trigger.change(info);
        return du.class.remove(container, 'open');
      }

      info.to = to;
      this.trigger.beforeChange(info)
      this.selected(to);
      info.content = contentContainer(to, container);
      this.update(info.content.hasAttribute('empty-contents'), container);
      info.content.removeAttribute('empty-contents');
      du.class.add(container, 'open');
      du.class.add(tab, 'selected');
      du.show(info.content);
      if (from == undefined) this.trigger.open(info);
      this.trigger.change(info);
    }
    this.container = (title, elem) => title ? contentContainer(title, elem) : fileTabContainer;
    this.update = (force, elem) => {
      if (force || this.shouldRender()) {
        const contentCnt = contentContainer(null, elem);
        if (contentCnt) {
          const html = this.html(selected);
          if ((typeof html) === 'string') contentCnt.innerHTML = html;
        }
      }
    }

    this.isOpen = () => list[selected];

    this.selectedHtml = () => list[selected] ? list[selected].html() : '';
    this.html = (title) => {
      if (!title) return FileTabDisplay.template.render(this);
      const html = list[title].html(this.container(title));
      return html;
    }
  }
}

du.on.match('click', '.file-tab-cnt > ul > li', (tab, event) => {
  event.preventDefault();
  const container = du.find.closest('.file-tab-cnt', tab);
  const ftd = FileTabDisplay.get(container.id);
  const title = tab.innerText;
  ftd.switch(title, container);
});

FileTabDisplay.template = new $t('lists/file-tab');

module.exports = FileTabDisplay;
