
const FileTab = require('../lists/file-tab');
const du = require('../dom-utils');

class HtmlTest extends FileTab {
  constructor() {
    super();
    const instance = this;
    let initialized = false;
    function init() {
      if (initialized) return;
      const id = 'html-test-' + String.random();
      const container = du.create.element('div', {id});
      document.body.prepend(container);
      const siblings = container.parentElement.children;
      du.hide(...siblings)
      du.show(container);

      const tabId = instance.id().toString();

      const tabContainer = du.create.element('div', {id: tabId});
      container.append(tabContainer);


      const closeBtnCnt = du.create.element('div', {class: 'center'});
      container.append(closeBtnCnt);

      const buttonId = id + '-close-btn';
      const closeBtn = du.create.element('button', {id: buttonId, class: 'center'});
      closeBtn.innerText = 'Close Test Html';
      closeBtnCnt.append(closeBtn);
      initialized = true;

      du.on.match('click', `#${buttonId}`, () => {
        console.log('cliiik');
        du.show(...siblings);
        container.remove();
      });
    }


    this.on.register((name) => {
      init();
      if (this.selected() === undefined) this.selected(name);
      this.build();
    });
  }
}


const htmlTest = new HtmlTest();

module.exports = htmlTest;
