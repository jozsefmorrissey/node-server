


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
class ExpandableList {
  constructor(props) {
    const afterRenderEvent = new CustomEvent('afterRender');
    const afterAddEvent = new CustomEvent('afterAdd');
    const afterRefreshEvent = new CustomEvent('afterRefresh');
    const instance = this;
    props.ERROR_CNT_ID = `expandable-error-msg-cnt-${props.id}`;
    props.inputTreeId = `expandable-input-tree-cnt-${props.id}`;
    props.type = props.type || 'list';
    props.findElement = props.findElement || ((selector, target) =>  du.find.closest(selector, target));
    props.selfCloseTab = props.selfCloseTab === undefined ? true : props.selfCloseTab;
    props.getObject = props.getObject || (() => {});
    props.inputs = props.inputs || [];
    props.list = props.list || [];
    this.getHeader = props.getHeader; delete props.getHeader;
    this.getBody = props.getBody; delete props.getBody;
    props.id = ExpandableList.lists.length;
    props.activeIndex = 0;
    Object.getSet(this, props, 'listElemLable');
    let pendingRefresh = false;
    let lastRefresh = new Date().getTime();
    const storage = {};
    ExpandableList.lists[props.id] = this;

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

    this.add = () => {
      const inputValues = values();
      if ((typeof props.inputValidation) !== 'function' ||
              props.inputValidation(inputValues) === true) {
        props.list.push(props.getObject(inputValues));

        this.activeIndex(props.list.length - 1);
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
      props.inputTree.onComplete(this.add);
    props.hasInputTree = this.hasInputTree;

    this.isSelfClosing = () => props.selfCloseTab;
    this.remove = (index) => {
      props.list.splice(index, 1);
      this.refresh();
    }
    this.html = () => ExpandableList[`${instance.type()}Template`].render(this);
    this.afterRender = (func) => afterRenderEvent.on(func);
    this.afterAdd = (func) => afterAddEvent.on(func);
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
    this.activeIndex = (value) => value === undefined ? props.activeIndex : (props.activeIndex = value);
    this.active = () => props.list[this.activeIndex()];
    this.value = (index) => (key, value) => {
      if (props.activeIndex === undefined) props.activeIndex = 0;
      if (index === undefined) index = props.activeIndex;
      if (storage[index] === undefined) storage[index] = {};
      if (value === undefined) return storage[index][key];
      storage[index][key] = value;
    }
    this.inputHtml = () => this.hasInputTree() ? this.inputTree().html() : ExpandableList.inputRepeatTemplate.render(this);
    this.set = (index, value) => props.list[index] = value;
    this.get = (index) => props.list[index];
    this.renderBody = (target) => {
      const headerSelector = `.expand-header[ex-list-id='${props.id}'][index='${this.activeIndex()}']`;
      target = target || document.querySelector(headerSelector);
      if (target !== null) {
        const id = target.getAttribute('ex-list-id');
        const list = ExpandableList.lists[id];
        const headers = du.find.up('.expandable-list', target).querySelectorAll('.expand-header');
        const bodys = du.find.up('.expandable-list', target).querySelectorAll('.expand-body');
        const rmBtns = du.find.up('.expandable-list', target).querySelectorAll('.expandable-item-rm-btn');
        headers.forEach((header) => header.className = header.className.replace(/(^| )active( |$)/g, ''));
        bodys.forEach((body) => body.style.display = 'none');
        rmBtns.forEach((rmBtn) => rmBtn.style.display = 'none');
        const body = du.find.closest('.expand-body', target);
        body.style.display = 'block';
        const index = target.getAttribute('index');
        this.activeIndex(index);
        body.innerHTML = this.htmlBody(index);
        target.parentElement.querySelector('.expandable-item-rm-btn').style.display = 'block';
        target.className += ' active';
        afterRenderEvent.trigger();
        // du.scroll.intoView(target.parentElement, 3, 25, document.body);
      }
    };
    afterRefreshEvent.on(() => {if (!props.startClosed)this.renderBody()});

    this.htmlBody = (index) => this.getBody(this.list()[index], index);
    this.getList = () => props.list;
    this.refresh();
  }
}
ExpandableList.lists = [];
ExpandableList.inputRepeatTemplate = new $t('expandable/input-repeat');
ExpandableList.listTemplate = new $t('expandable/list');
ExpandableList.pillTemplate = new $t('expandable/pill');
ExpandableList.sidebarTemplate = new $t('expandable/sidebar');
ExpandableList.getIdAndIndex = (target) => {
  const cnt = du.find.up('.expand-header,.expand-body', target);
  const id = Number.parseInt(cnt.getAttribute('ex-list-id'));
  const index = Number.parseInt(cnt.getAttribute('index'));
  return {id, index};
}
ExpandableList.getValueFunc = (target) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].value(idIndex.index);
}

ExpandableList.get = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  return ExpandableList.lists[idIndex.id].get(idIndex.index);
}

ExpandableList.set = (target, value) => {
  const idIndex = ExpandableList.getIdAndIndex(target);
  ExpandableList.lists[idIndex.id].set(idIndex.index, value);
}

ExpandableList.value = (key, value, target) => {
  return ExpandableList.getValueFunc(target)(key, value);
}
du.on.match('click', '.expandable-list-add-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  ExpandableList.lists[id].add();
});
du.on.match('click', '.expandable-item-rm-btn', (target) => {
  const id = target.getAttribute('ex-list-id');
  const index = target.getAttribute('index');
  ExpandableList.lists[id].remove(index);
});
ExpandableList.closeAll = (header) => {
  const hello = 'world';
}

du.on.match('click', '.expand-header', (target, event) => {
  const isActive = target.matches('.active');
  const id = target.getAttribute('ex-list-id');
  const list = ExpandableList.lists[id];
  if (list) {
    if (isActive && !event.target.tagName.match(/INPUT|SELECT/)) {
      target.className = target.className.replace(/(^| )active( |$)/g, '');
      du.find.closest('.expand-body', target).style.display = 'none';
      list.activeIndex(null);
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

module.exports = ExpandableList
