




const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');

class MultipleEntries extends Input {
  constructor(inputArray, props) {
    props ||= {};
    super(props);
    let inputArrayFunc;
    if ((typeof inputArray) === 'function') {
      inputArrayFunc = inputArray;
      inputArray = [];
    }
    props.list ||= [];
    this.set = (index) => {
      if (props.list[index] === undefined) {
        const list = [];
        props.list[index] = list;
        inputArray.forEach((i) =>
          list.push(i.clone()));
      }
      return props.list[index];
    }
    this.set(0);
    // Allows for recursion.
    let hasInit = false;
    this.isInitialized = () => hasInit;
    this.initialize = () => {
      if (hasInit) return;
      if (inputArrayFunc) {
        props.list.copy([]);
        inputArray.copy(inputArrayFunc());
        this.set(0);
      }
      hasInit = true;
    }
    this.value = (val) => {
      const values = [];
      const list = this.list();
      for (let i = 0; i < list.length; i++) {
        const inputArr = list[i]
        values[i] = {};
        for(let index = 0; index < inputArr.length; index++) {
          const input = inputArr[index];
          values[i][input.name()] = input.value();
        }
      }
      return values;
    };
    this.length = () => this.list().length;
    this.setHtml = (index) =>
        MultipleEntries.singleTemplate.render(this.set(index));
  }
}

MultipleEntries.template = new $t('input/multiple-entries');
MultipleEntries.singleTemplate = new $t('input/one-entry');
MultipleEntries.html = (instance) => () => MultipleEntries.template.render(instance);

function meInfo(elem) {
  const info = {};
  info.oneCnt = du.find.up('.one-entry-cnt', elem);
  if (info.oneCnt) {
    info.indexCnt = du.find.up('[index]', info.oneCnt);
    info.index = Number.parseInt(info.indexCnt.getAttribute('index'));
    const ae =  document.activeElement;
    info.inFocus = !(!(ae && ae.id && du.find.down('#' + ae.id, info.indexCnt)));
  }
  info.multiCnt = du.find.up('.multiple-entry-cnt', info.indexCnt || elem);
  info.multiInput = MultipleEntries.getFromElem(info.multiCnt);
  info.length = info.multiInput.length();
  info.inputs = du.find.downAll('input,select,textarea', info.indexCnt);
  info.last = info.index === info.length - 1;
  info.empty = true;
  info.multiInput.set(info.index).forEach(i => info.empty &&= (i.value() == false));
  return info;
}

const meSelector = '.multiple-entry-cnt input,select,textarea';
const oneSelector = '.one-entry-cnt *';
const isInput = (elem) => elem.tagName.match(/(SELECT|INPUT|TEXTAREA)/) !== null;
du.on.match('change', meSelector, (elem) => {
  // console.log('changed');
});

du.on.match('click', meSelector, (elem) => {
  // console.log('clicked');
});

const lastCallers = [];
du.on.match('focusout', '.one-entry-cnt', (elem) => {
  let info = meInfo(elem);
  if (!lastCallers[info.index]) lastCallers[info.index] = 0;
  const id = ++lastCallers[info.index];
  setTimeout(() => {
    if (id !== lastCallers[info.index]) return;
    info = meInfo(elem);
    if (!info.last && !info.inFocus && info.empty) {
      info.indexCnt.remove()
      const children = info.multiCnt.children;
      for (let index = 0; index < children.length; index++) {
        children[index].setAttribute('index', index);
      }
      const list = info.multiInput.list();
      list.remove(list[info.index]);
    }
  }, 2000);
});

du.on.match('focusin', oneSelector, (elem) => {
  // console.log('focusin');
});

du.on.match('keyup', oneSelector, (elem) => {
  if (!isInput(elem)) return;
  const info = meInfo(elem);
  if (info.index === info.length - 1 && !info.empty) {
    const newElem = du.create.element('div', {index: info.index + 1});
    newElem.innerHTML = info.multiInput.setHtml(info.index + 1);
    info.multiCnt.append(newElem);
    console.log('add 1')
  }
  // console.log('keyup');
});

module.exports = MultipleEntries;
