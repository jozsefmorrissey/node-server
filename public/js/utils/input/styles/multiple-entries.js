




const Input = require('../input');
const $t = require('../../$t');
const du = require('../../dom-utils');

const validation = () => true;
class MultipleEntries extends Input {
  constructor(inputTemplate, props) {


    props ||= {};
    props.validation ||= (event, details) => {
      const list = props.list;
      let allEmpty = true;
      let valid = true;
      for (let index = 0; index < list.length; index++) {
        const input = list[index];
        const empty = input.empty();
        if (!empty) {
          if (input.optional) input.optional(false);
          valid &= list[index].valid();
        }
        allEmpty &= empty;
      }
      return !allEmpty && valid;
    }
    if (props.list === undefined) {
      const list = [];
      props.list = list;
      props.list.forEach((i) =>
        list.push(i.clone()));
    }

    props.list ||= [];
    super(props);
    Object.getSet(this, 'inputTemplate');
    let template;
    const instance = this;
    this.inputTemplate = () => {
      if (!template) {
        if ((typeof inputTemplate) === 'function') {
          template = inputTemplate();
        } else template = inputTemplate;
      }
      return template;
    }

    this.empty = () => {
      if (props.list.length > 1) return false;
      const inputs = props.list[0];
      for (let index = 0; index < inputs.length; index++) {
        if (!inputs[index].empty()) return false;
      }
      return true;
    }
    this.valid = () => this.value().length > 0;

    this.clone = () =>
        new MultipleEntries(inputTemplate, JSON.clone(props));

    this.set = (index, value) => {
      if (props.list[index] === undefined) {
        props.list[index] = this.inputTemplate().clone({optional: true});
        if (props.list[index].on) {
          props.list[index].on('change', this.validation);
        } else {
          props.list[index].onChange(this.validation);
        }
      }
      return props.list[index];
    }

    this.tag = () => props.inline() ? 'span' : 'div';

    this.input = (nameOindexOfunc) => {
      const nif = nameOindexOfunc;
      if ((typeof nif) === 'number') return props.list[nif];
      const runFunc = (typeof nif) === 'function';
      for (let index = 0; index < props.list.length; index++) {
        const input = props.list[index];
        if (runFunc) {
          const val = nif(input);
          if (val) return val;
        } else if (input.name() === nif) return input;

        if (input instanceof MultipleEntries) {
          const mInput = input.input(nif);
          if (mInput) return mInput;
        }
      }
    }
    this.getValue = () => {
      const values = [];
      for (let index = 0; index < props.list.length; index++) {
        const input = props.list[index];
        if (!input.empty()) {
          if (input.valid()) {
            values.push(input.value());
          } else {
            input.valid();
            input.valid();
          }
        }
      }
      return values;
    }

    this.setValue = (list) => {
      if (list) {
        list.forEach((val, index) => {
            const input = this.set(index)
            input.setValue(val);
        });
      }
    }

    this.value = this.getValue;

    const parentHtml = this.html;
    this.html = () => {
      if (props.list.length === 0 || !props.list[props.list.length - 1].empty()) this.set(props.list.length);
      return parentHtml();
    }

    this.length = () => this.list().length;
    this.setHtml = (index) => MultipleEntries.singleTemplate.render(this.set(index));

    this.setValue(props.value);
  }
}

MultipleEntries.template = new $t('input/multiple-entries');
MultipleEntries.singleTemplate = new $t('input/one-entry');
MultipleEntries.html = (instance) => () => MultipleEntries.template.render(instance);

MultipleEntries.fromJson = (json) => {
  const inputTemplate = Object.fromJson(json.inputTemplate);
  return new MultipleEntries(inputTemplate, json);

}

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
  info.inputs = du.find.downAll('input,select,textarea', info.oneCnt);
  info.last = info.index === info.length - 1;
  info.empty = info.multiInput.list()[info.index].empty();
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

du.on.match('keyup:change', oneSelector, (elem) => {
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
