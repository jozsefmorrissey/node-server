


const CustomEvent = require('../custom-error.js');
const du = require('../dom-utils.js');
const $t = require('../$t.js');
const Expandable = require('./expandable');

class ExpandableList extends Expandable {
  constructor(props) {
    super(props);
    const superRemove = this.remove;
    this.remove = (index) => {
      superRemove(props.list.splice(index, 1)[0]);
      this.refresh();
    }
  }
}

module.exports = ExpandableList
