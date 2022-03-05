


const CustomEvent = require('../custom-error.js');
const du = require('../dom-utils.js');
const $t = require('../$t.js');
const Expandable = require('./expandable');

class ExpandableObject extends Expandable {
  constructor(props) {
    super(props);
	//TODO: Set aciveKey
    const superRemove = this.remove;
    this.remove = (key) => {
      const removed = props.list[key];
      delete props.list[key];
      superRemove(removed);
    }

    this.getKey = () => this.values().name;
  }
}
module.exports = ExpandableObject
