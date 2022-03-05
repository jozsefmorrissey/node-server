


const CustomEvent = require('../custom-error.js');
const du = require('../dom-utils.js');
const $t = require('../$t.js');

// properties
//  required: {
//  getHeader: function returns html header string,
//  getBody: function returns html body string,
//}
//  optional: {
//  list: list to use, creates on undefined
//  getObject: function returns new list object default is generic js object,
//  parentSelector: cssSelector only reqired for refresh function,
//  listElemLable: nameOfElementType changes add button label,
//  hideAddBtn: defaults to false,
//  startClosed: all tabs are closed on list open.
//  input: true - require user to enter text before adding new
//  inputOptions: array of autofill inputs
//  inputs: [{placeholder, autofill},...]
//  inputValidation: function to validate input fields
//  type: defaults to list,
//  selfCloseTab: defalts to true - allows clicking on header to close body,
//  findElement: used to find elemenents related to header - defaults to closest
//}
class Expandable {
  constructor(props) {
    const afterRenderEvent = new CustomEvent('afterRender');
    const afterAddEvent = new CustomEvent('afterAdd');
    const afterRefreshEvent = new CustomEvent('afterRefresh');
    const afterRemovalEvent = new CustomEvent('afterRemoval');
    const instance = this;
    props.ERROR_CNT_ID = `expandable-error-msg-cnt-${props.id}`;
    props.inputTreeId = `expandable-input-tree-cnt-${props.id}`;
    props.type = props.type || 'list';
    props.findElement = props.findElement || ((selector, target) =>  du.find.closest(selector, target));
    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
    props.getObject = props.getObject || (() => {});
    props.inputs = props.inputs || [];
    props.list = props.list || [];
    // props.list.DO_NOT_CLONE = true;
    this.getHeader = props.getHeader; delete props.getHeader;
    this.getBody = props.getBody; delete props.getBody;
    props.id = Expandable.lists.length;
    props.activeKey = 0; //TODO ???
    Object.getSet(this, props, 'listElemLable');
    let pendingRefresh = false;
    let lastRefresh = new Date().getTime();
    const storage = {};
    Expandable.lists[props.id] = this;

    this.errorCntId = () => props.ERROR_CNT_ID;
    function setErrorMsg(msg) {
        du.id(props.ERROR_CNT_ID).innerHTML = msg;
    }

    function values() {
      if (instance.hasInputTree()) return props.inputTree.values();
      const values = {};
      props.inputs.forEach((input) =>
        values[input.placeholder] = du.id(input.id).value);
      return values;
    }

    function getCnt() {
      return document.querySelector(`.expandable-list[ex-list-id='${props.id}']`);
    }

    function getInputCnt() {
      const cnt = du.find.down('.expand-input-cnt', getCnt());
      return cnt;
    }
    //changes....
    this.values = values;
    this.getInputCnt = getInputCnt;

    this.add = () => {
      const key = this.getKey();
      const inputValues = values();
      if ((typeof props.inputValidation) !== 'function' ||
              props.inputValidation(inputValues) === true) {
        props.list[key] = props.getObject(inputValues, getInputCnt());
        this.activeKey(key);
        this.refresh();
        afterAddEvent.trigger();
        if (this.hasInputTree()) props.inputTree.formFilled();
      } else {
        const errors = props.inputValidation(inputValues);
        let errorStr;
        if ((typeof errors) === 'object') {
          const keys = Object.keys(errors);
          errorStr = Object.values(errors).join('<br>');
        } else {
          errorStr = `Error: ${errors}`;
        }
        setErrorMsg(errorStr);
      }
    };
    this.hasInputTree = () =>
      this.inputTree() && this.inputTree().constructor.name === 'DecisionNode';
    if (this.hasInputTree())
      props.inputTree.onComplete(() => this.add());
    props.hasInputTree = this.hasInputTree;

    this.isSelfClosing = () => props.selfCloseTab;
    this.remove = (removed) => {
      afterRemovalEvent.trigger(undefined, removed);
      this.refresh();
    }
    this.html = () =>
      Expandable[`${instance.type()}Template`].render(this);
    this.afterRender = (func) => afterRenderEvent.on(func);
    this.afterAdd = (func) => afterAddEvent.on(func);
    this.afterRemoval = (func) => afterRemovalEvent.on(func);
    this.refresh = (type) => {
      this.type((typeof type) === 'string' ? type : props.type);
      if (!pendingRefresh) {
        pendingRefresh = true;
        setTimeout(() => {
          props.inputs.forEach((input) => input.id = input.id || String.random(7));
          const parent = document.querySelector(props.parentSelector);
          const html = this.html();
          if (parent && html !== undefined) {
            parent.innerHTML = html;
            afterRefreshEvent.trigger();
          }
          pendingRefresh = false;
        }, 100);
      }
    };
    this.getKey = this.list().length;
    this.activeKey = (value) => value === undefined ? props.activeKey : (props.activeKey = value);
    this.getKey = () => this.activeKey();
    this.active = () => props.list[this.activeKey()];
    // TODO: figure out why i wrote this and if its neccisary.
    this.value = (key) => (key2, value) => {
      if (props.activeKey === undefined) props.activeKey = 0;
      if (key === undefined) key = props.activeKey;
      if (storage[key] === undefined) storage[key] = {};
      if (value === undefined) return storage[key][key2];
      storage[key][key2] = value;
    }
    this.inputHtml = () => this.hasInputTree() ? this.inputTree().html() : Expandable.inputRepeatTemplate.render(this);
    this.set = (key, value) => props.list[key] = value;
    this.get = (key) => props.list[key];
    this.renderBody = (target) => {
      const headerSelector = `.expand-header[ex-list-id='${props.id}'][key='${this.activeKey()}']`;
      target = target || document.querySelector(headerSelector);
      if (target !== null) {
        const id = target.getAttribute('ex-list-id');
        const list = Expandable.lists[id];
        const headers = du.find.up('.expandable-list', target).querySelectorAll('.expand-header');
        const bodys = du.find.up('.expandable-list', target).querySelectorAll('.expand-body');
        const rmBtns = du.find.up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
        headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
        bodys.forEach((body) => body.style.display = 'none');
        rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
        const body = du.find.closest('.expand-body', target);
        body.style.display = 'block';
        const key = target.getAttribute('key');
        this.activeKey(key);
        body.innerHTML = this.htmlBody(key);
        target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
        target.className += ' active';
        afterRenderEvent.trigger();
        // du.scroll.intoView(target.parentElement, 3, 25, document.body);
      }
    };
    afterRefreshEvent.on(() => {if (!props.startClosed)this.renderBody()});

    this.htmlBody = (key) => this.getBody(this.list()[key], key);
    this.list = () => props.list;
    this.refresh();
  }
}
Expandable.lists = [];
Expandable.DO_NOT_CLONE = true;
Expandable.inputRepeatTemplate = new $t('expandable/input-repeat');
Expandable.listTemplate = new $t('expandable/list');
Expandable.pillTemplate = new $t('expandable/pill');
Expandable.sidebarTemplate = new $t('expandable/sidebar');
Expandable.getIdAndKey = (target) => {
  const cnt = du.find.up('.expand-header,.expand-body', target);
  const id = Number.parseInt(cnt.getAttribute('ex-list-id'));
  const key = Number.parseInt(cnt.getAttribute('key'));
  return {id, key};
}
Expandable.getValueFunc = (target) => {
  const idKey = Expandable.getIdAndKey(target);
  return Expandable.lists[idKey.id].value(idKey.key);
}

Expandable.get = (target, value) => {
  const idKey = Expandable.getIdAndKey(target);
  return Expandable.lists[idKey.id].get(idKey.key);
}

Expandable.set = (target, value) => {
  const idKey = Expandable.getIdAndKey(target);
  Expandable.lists[idKey.id].set(idKey.key, value);
}

Expandable.value = (key, value, target) => {
  return Expandable.getValueFunc(target)(key, value);
}
du.on.match('click', '.expandable-list-add-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  Expandable.lists[id].add();
});
du.on.match('click', '.expandable-item-rm-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  const key = target.getAttribute('key');
  Expandable.lists[id].remove(key);
});
Expandable.closeAll = (header) => {
  const hello = 'world';
}

du.on.match('click', '.expand-header', (target, event) => {
  const isActive = target.matches('.active');
  const id = target.getAttribute('ex-list-id');
  const list = Expandable.lists[id];
  if (list) {
    if (isActive && !event.target.tagName.match(/INPUT|SELECT/)) {
      target.className = target.className.replace(/(^| )active( |$)/g, '');
      du.find.closest('.expand-body', target).style.display = 'none';
      list.activeKey(null);
      target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'none';
    } else if (!isActive) {
      list.renderBody(target);
    }
  }
});

du.on.match('click', '.input-open-cnt', (target) => {
  const inputCnts = document.querySelectorAll('.expand-input-cnt');
  const inputOpenCnts = document.querySelectorAll('.input-open-cnt');
  const closest = du.find.closest('.expand-input-cnt', target);
  inputCnts.forEach((elem) => elem.hidden = true);
  inputOpenCnts.forEach((elem) => elem.hidden = false);
  target.hidden = true;
  if (closest) closest.hidden = false;
});

module.exports = Expandable
