


const CustomEvent = require('../custom-error.js');
const du = require('../dom-utils.js');
const $t = require('../$t.js');
const Expandable = require('./expandable');

class ExpandableObject extends Expandable {
  constructor(props) {
    super(props);
	//TODO: Set aciveKey
    this.remove = (key) => {
      props.list[key] = undefined;
      this.refresh();
    }

    this.getKey = () => this.values().name;
  }
}
module.exports = ExpandableObject
