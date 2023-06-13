
const $t = require('../../$t');
const InputObject = require('../styles/object');

class PayloadHandler {
  constructor(templateName, ...inputs) {
    Object.getSet(this, {templateName, inputs});
    const template = new $t(this.templateName());

    this.html = (payload) => template.render(payload);
    this.input = () => new InputObject({name: 'payload', list: inputs});
    this.toJson = () => ({inputs: Object.toJson(inputs), templateName});
  }
}

module.exports = PayloadHandler;
