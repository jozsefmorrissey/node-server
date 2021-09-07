


const du = require('../../../../public/js/utils/dom-utils.js');

class InformationBar {
  constructor() {
    const container = du.create.element('div');
    container.className = 'information-bar';

    this.show = () => container.hidden = false;
    this.hide = () => container.hidden = true;
    this.update = (html) => container.innerHTML = html;

    document.body.append(container);
  }
}
module.exports = InformationBar




