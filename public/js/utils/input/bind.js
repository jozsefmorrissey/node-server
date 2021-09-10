
const du = require('../dom-utils');
const Input = require('./input');

const defaultDynamInput = (value, type) => new Input({type, value});

module.exports = function(selector, objOrFunc, props) {
  let lastInputTime = {};
  props = props || {};
  const validations = props.validations || {};
  const inputs = props.inputs || {};

  const resolveTarget = (elem) => du.find.down('[prop-update]', elem);
  const getValue = (updatePath, elem) => {
    const input = inputs.pathValue(updatePath);
    return input ? input.value() : elem.value;
  }
  const getValidation = (updatePath) => {
    let validation = validations.pathValue(updatePath);
    const input = inputs.pathValue(updatePath);
    if (input) {
      validation = input.validation;
    }
    return validation;
  }

  function update(elem) {
    const target = resolveTarget(elem);
    elem = du.find.down('input,select,textarea', elem);
    const updatePath = elem.getAttribute('prop-update') || elem.getAttribute('name');
    elem.id = elem.id || String.random(7);
    const thisInputTime = new Date().getTime();
    lastInputTime[elem.id] = thisInputTime;
    setTimeout(() => {
      if (thisInputTime === lastInputTime[elem.id]) {
        const validation = getValidation(updatePath);
        if (updatePath !== null) {
          const newValue = getValue(updatePath, elem);
          if ((typeof validation) === 'function' && !validation(newValue)) {
            console.error('badValue')
          } else if ((typeof objOrFunc) === 'function') {
            objOrFunc(updatePath, elem.value);
          } else {
            objOrFunc.pathValue(updatePath, elem.value);
          }

          if (target.tagname !== 'INPUT' && target.children.length === 0) {
            target.innerHTML = newValue;
          }
        }
      }
    }, 2000);
  }
  const makeDynamic = (target) => {
    target = resolveTarget(target);
    if (target.getAttribute('resolved') === null) {
      target.setAttribute('resolved', 'dynam-input');
      const value = target.innerText;
      const type = target.getAttribute('type');
      const updatePath = target.getAttribute('prop-update') || target.getAttribute('name');
      const input = inputs.pathValue(updatePath) || defaultDynamInput(value, type);

      target.innerHTML = input.html();
      const inputElem = du.find.down(`#${input.id}`, target);
      du.class.add(inputElem, 'dynam-input');
      inputElem.setAttribute('prop-update', updatePath);
      inputElem.focus();
    }
  }

  du.on.match('keyup', selector, update);
  du.on.match('change', selector, update);
  du.on.match('click', selector, makeDynamic);
}


const undoDynamic = (target) => {
  const parent = du.find.up('[resolved="dynam-input"]', target)
  parent.innerText = target.value;
  parent.removeAttribute('resolved');
}

du.on.match('focusout', '.dynam-input', undoDynamic);
