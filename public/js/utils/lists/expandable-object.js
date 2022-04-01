


const CustomEvent = require('../custom-error.js');
const du = require('../dom-utils.js');
const $t = require('../$t.js');
const Expandable = require('./expandable');

class ExpandableObject extends Expandable {
  constructor(props) {
    props.list = props.list || {};
    super(props);
	//TODO: Set aciveKey

    const superRemove = this.remove;
    this.remove = (key) => {
      const removed = props.list[key];
      delete props.list[key];
      superRemove(removed);
    }

    this.getKey = (values) => {
      if (values) this.activeKey(values.name);
      return this.activeKey() || undefined;
    }
  }
}
module.exports = ExpandableObject
