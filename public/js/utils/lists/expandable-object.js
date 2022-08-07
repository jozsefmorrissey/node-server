


const CustomEvent = require('../custom-error.js');
const du = require('../dom-utils.js');
const $t = require('../$t.js');
const Expandable = require('./expandable');


class ExpandableObject extends Expandable {
  constructor(props) {
    props.list = props.list || {};
    let idAttr, mappedObject;
    if (props.idAttribute) {
      idAttr = props.idAttribute;
      mappedObject = props.mappedObject || {}
    }
    super(props);
	//TODO: Set aciveKey

    const superRemove = this.remove;
    this.remove = (key) => {
      const removed = props.list[key];
      delete props.list[key];
      superRemove(removed);
    }

    function undefinedAttr(attr, object) {
      if (object === undefined) return attr;
      let currAttr = attr;
      let count = 1;
      while(object[currAttr] !== undefined) {
        if (object[currAttr] === object) return currAttr;
        currAttr = `${attr}-${count++}`;
      }
      return currAttr;
    }

    const valOfunc = (obj, attr) => (typeof obj[attr]) === 'function' ? obj[attr]() : obj[attr];
    this.updateMapped = (obj) => {
      if (idAttr === undefined) return;
      obj = obj || props.list[this.activeKey()];
      if (obj) {
        const name = undefinedAttr(valOfunc(obj, idAttr), mappedObject);
        if (name !== obj._EXPAND_LAST_OBJECT_NAME) {
          mappedObject[name] = mappedObject[obj._EXPAND_LAST_OBJECT_NAME];
          delete mappedObject[obj._EXPAND_LAST_OBJECT_NAME];
          obj._EXPAND_LAST_OBJECT_NAME = name;
        }
      }
    }
    this.getMappedObject = () => mappedObject;

    this.getKey = (values, object) => {
      if (object && object._EXPAND_KEY === undefined) {
        object._EXPAND_KEY = String.random();
        object._EXPAND_LAST_OBJECT_NAME = undefinedAttr(valOfunc(object, idAttr), mappedObject);
        if (idAttr !== undefined) mappedObject[object._EXPAND_LAST_OBJECT_NAME] = object;
      }
      if (object) this.activeKey(object._EXPAND_KEY);
      if (idAttr) this.updateMapped(object);
      return this.activeKey() || undefined;
    }
  }
}
module.exports = ExpandableObject
