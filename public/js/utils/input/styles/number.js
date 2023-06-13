
const Input = require('../input');
const $t = require('../../$t');

class NumberInput extends Input {
  constructor(props) {
    super(props);
    props.min = Number.parseFloat(props.min) || 0;
    props.max = Number.parseFloat(props.max) || Number.MAX_SAFE_INTEGER;
    props.step = Number.parseFloat(props.step) || 1;
    Object.getSet(this, {min: props.min, max: props.max, step: props.step});

    this.validation = (value) => value <= props.max && value >= props.min;
  }
}

NumberInput.template = new $t('input/number');
NumberInput.html = (instance) => () => NumberInput.template.render(instance);

module.exports = NumberInput;
