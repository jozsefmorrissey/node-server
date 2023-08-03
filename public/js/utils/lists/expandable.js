


const CustomEvent = require('../custom-event.js');
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
//  dontOpenOnAdd: by default the active element will be switched to newly added elements.
//  hideAddBtn: defaults to false,
//  startClosed: all tabs are closed on list open.
//  input: true - require user to enter text before adding new
//  inputOptions: array of autofill inputs
//  inputs: [{placeholder, autofill},...]
//  inputValidation: function to validate input fields
//  type: defaults to list,
//  selfCloseTab: defalts to true - allows clicking on header to close body,
//  findElement: used to find elemenents related to header - defaults to closest
//  removeButton: true by default;
//}
class Expandable {
  constructor(props) {
    const afterRenderEvent = new CustomEvent('afterRender');
    const afterAddEvent = new CustomEvent('afterAdd');
    const afterRefreshEvent = new CustomEvent('afterRefresh');
    const afterRemovalEvent = new CustomEvent('afterRemoval');
    const instance = this;
    const renderBodyOnOpen = props.renderBodyOnOpen === false ? false : true;
    props.getObject = props.getObject || (() => ({}));
    props.ERROR_CNT_ID = `expandable-error-msg-cnt-${props.id}`;
    props.inputTreeId = `expandable-input-tree-cnt-${props.id}`;
    props.type = props.type || 'list';
    props.findElement = props.findElement || ((selector, target) =>  du.find.closest(selector, target));
    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
    props.getObject = props.getObject || (() => {});
    props.inputs = props.inputs || [];
    props.list = props.list || [];
    // props.list.DO_NOT_CLONE = true;
    this.hasBody = () => (typeof this.getBody) === 'function';
    this.getHeader = props.getHeader; delete props.getHeader;
    this.getBody = props.getBody; delete props.getBody;
    props.id = Expandable.lists.length;
    const firstKey = Object.keys(props.list)[0];
    props.activeKey = firstKey || 0; //TODO ???
    Object.getSet(this, props, 'listElemLable');
    let pendingRefresh = false;
    let lastRefresh = new Date().getTime();
    const storage = {};
    Expandable.lists[props.id] = this;
    this.inputTree = () => props.inputTree;
    this.parentSelector = () => props.parentSelector;

    this.errorCntId = () => props.ERROR_CNT_ID;
    function setErrorMsg(msg) {
        du.id(props.ERROR_CNT_ID).innerHTML = msg;
    }

    function values() {
      const values = {};
      props.inputs.forEach((input) =>
        values[input.placeholder] = du.id(input.id).value);
      return values;
    }

    function getCnt() {
      return document.querySelector(`.expandable-list[ex-list-id='${props.id}']`);
    }

    function getBodyCnt() {
      return du.find.down('.expand-body', getCnt());
    }

    function getInputCnt() {
      const cnt = du.find.down('.expand-input-cnt', getCnt());
      return cnt;
    }
    //changes....
    this.values = values;
    this.getInputCnt = getInputCnt;

    this.add = (vals) => {
      const inputValues = vals || values();
      if ((typeof props.inputValidation) !== 'function' ||
              props.inputValidation(inputValues) === true) {
          const obj = props.getObject(inputValues, getInputCnt());
          const key = this.getKey(vals, obj);
          props.list[key] = obj;
          if (!props.dontOpenOnAdd) this.activeKey(key);
          this.refresh();
          afterAddEvent.trigger();
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
	      this.inputTree() && this.inputTree().constructor.name === 'DecisionInputTree';
    if (this.hasInputTree())
      props.inputTree.onSubmit(this.add);
    props.hasInputTree = this.hasInputTree;

    this.isSelfClosing = () => props.selfCloseTab;
    this.remove = (removed) => {
      afterRemovalEvent.trigger(undefined, removed);
      this.refresh();
    }
    this.html = () =>
      Expandable[`${instance.type().toCamel()}Template`].render(this);
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
          const focusInfo = du.focusInfo();
          const html = this.html();
          if (parent && html !== undefined) {
            parent.innerHTML = html;
            du.focus(focusInfo);
            afterRefreshEvent.trigger();
          }
          pendingRefresh = false;
        }, 100);
      }
    };
    this.activeKey = (value) => value === undefined ? props.activeKey : (props.activeKey = value);
    this.getKey = () => this.list().length;
    this.active = () => props.list[this.activeKey()];
    // TODO: figure out why i wrote this and if its neccisary.
    this.value = (key) => (key2, value) => {
      if (props.activeKey === undefined) props.activeKey = 0;
      if (key === undefined) key = props.activeKey;
      if (storage[key] === undefined) storage[key] = {};
      if (value === undefined) return storage[key][key2];
      storage[key][key2] = value;
    }
    this.inputHtml = () => this.hasInputTree() ?
          this.inputTree().html() : Expandable.inputRepeatTemplate.render(this);
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
        const body = bodys.length === 1 ? bodys[0] : du.find.closest('.expand-body', target);
        if (this.hasBody()) {
          body.style.display = 'block';
        }
        const key = target.getAttribute('key');
        this.activeKey(key);
        if (renderBodyOnOpen) body.innerHTML = this.htmlBody(key);
        if (props.removeButton !== false) target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
        target.className += ' active' + (this.hasBody() ? '' : ' no-body');
        afterRenderEvent.trigger();
        // du.scroll.intoView(target.parentElement, 3, 25, document.body);
      }
    };
    afterRefreshEvent.on(() => {if (!props.startClosed)this.renderBody()});

    this.htmlBody = (key) => {
      getBodyCnt().setAttribute('key', key);
      return this.hasBody() ? this.getBody(this.list()[key], key) : '';
    }
    this.list = () => props.list;
    this.refresh();
    // setTimeout(() => {
    //   const headerSelector = `.expand-header[ex-list-id='${props.id}'][key='${this.activeKey()}']`;
    //   const activeHeader = du.find(headerSelector);
    //   if (activeHeader) activeHeader.click();
    // }, 2000);
  }
}
Expandable.lists = [];
Expandable.DO_NOT_CLONE = true;
Expandable.inputRepeatTemplate = new $t('expandable/input-repeat');
Expandable.listTemplate = new $t('expandable/list');
Expandable.pillTemplate = new $t('expandable/pill');
Expandable.sidebarTemplate = new $t('expandable/sidebar');
Expandable.topAddListTemplate = new $t('expandable/top-add-list');
Expandable.getIdAndKey = (target, level) => {
  level ||= 0;
  const elems = du.find.upAll('.expand-header,.expand-body', target);
  if (elems.length < level + 1) return undefined;
  const cnt = elems[level];
  const id = Number.parseInt(cnt.getAttribute('ex-list-id'));
  const key = cnt.getAttribute('key');
  return {id, key};
}
Expandable.getValueFunc = (target) => {
  const idKey = Expandable.getIdAndKey(target);
  return Expandable.lists[idKey.id].value(idKey.key);
}

Expandable.get = (target, level) => {
  const idKey = Expandable.getIdAndKey(target, level);
  if (idKey === undefined) return undefined;
  return Expandable.lists[idKey.id].get(idKey.key);
}

Expandable.bySelector = (parentSelector) => {
  const lists = Expandable.lists;
  const expandKeys = Object.keys(lists);
  if (expandKeys.length > 1000) console.warn.subtle(1000, 'Its time to start freeing expandable list data');
  for (let i = 0; i < expandKeys.length; i++) {
    const key = expandKeys[i];
    if (lists[key].parentSelector() === parentSelector) return lists[key];
  }
  return null;
}

Expandable.list = (target) => {
  const idKey = Expandable.getIdAndKey(target);
  return Expandable.lists[idKey.id];
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
      du.class.remove(target, 'active');
      du.find.closest('.expand-body', target).style.display = 'none';
      list.activeKey(null);
      target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'none';
    } else if (!isActive) {
      list.renderBody(target);
    }
  }
});

function getExpandObject(elem) {
  const exListElem = du.find.up('[ex-list-id]', elem);
  if (!exListElem) return undefined;
  const listId = exListElem.getAttribute('ex-list-id');
  return Expandable.lists[listId];
}

du.on.match('click', '.input-open-cnt', (target) => {
  const inputCnts = document.querySelectorAll('.expand-input-cnt');
  const expandList = getExpandObject(target);
  if (expandList && !expandList.hasInputTree()) expandList.add();
  else {
    const inputOpenCnts = document.querySelectorAll('.input-open-cnt');
    const closest = du.find.closest('.expand-input-cnt', target);
    inputCnts.forEach((elem) => elem.hidden = true);
    inputOpenCnts.forEach((elem) => elem.hidden = false);
    target.hidden = true;
    if (closest) closest.hidden = false;
  }
});

module.exports = Expandable
