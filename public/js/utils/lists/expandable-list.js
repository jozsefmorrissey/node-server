


const CustomEvent = require('../custom-error.js');
const du = require('../dom-utils.js');
const $t = require('../$t.js');
const Expandable = require('./expandable');

class ExpandableList extends Expandable {
  constructor(props) {
    super(props);
    this.remove = (index) => {
      props.list.splice(index, 1);
      this.refresh();
    }
  }
}

module.exports = ExpandableList
