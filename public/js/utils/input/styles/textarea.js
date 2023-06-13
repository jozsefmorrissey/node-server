
const Input = require('../input');
const $t = require('../../$t');

class Textarea extends Input {
  constructor(props) {
    super(props);
    Object.getSet(this);
  }
}

Textarea.template = new $t('input/textarea');
Textarea.html = (instance) => () => Textarea.template.render(instance);

module.exports = Textarea;
