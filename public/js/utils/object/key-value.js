
const Lookup = require('./lookup');
const Notifiction = require('../collections/notification.js');
const NotifictionArray = Notifiction.Array;
const CustomEvent = require('../custom-event.js');

function updateParent(keyValue, event) {
  return (detail, target) => {
    if (detail.new instanceof KeyValue) {
      const parentAttr = detail.new.value.parentAttribute();
      if (parentAttr) {
        detail.new[parentAttr](keyValue);
        if (event) detail.new.trigger.parentSet();
      }
    }
  }
}

/**
  properties:
    @childrenAttribute - Attribute that defines children an object or an array;
    @object - true iff you want an object for your children
    @parentAttribute - Attribute that defines parent setting/getting function;
    @keyMapFunction - function will be called to convert keys before processing.
    @id - Lookup id
    @idAttr - attribute for Lookup id.
    @evaluators - an object whos attributes are types, the values are functions to resolve said type
**/
class KeyValue extends Lookup {
  constructor(properties) {
    super(properties.id, properties.idAttr);
    const childAttr = properties.childrenAttribute;
    const parentAttr = properties.parentAttribute;
    const instance = this;
    const customFuncs = [];
    CustomEvent.all(this, 'change','parentSet');

    if (childAttr) {
      if (properties.object) this[childAttr] = new Notifiction(false);
      else this[childAttr] = new NotifictionArray(false);
      this[childAttr].on.afterChange(updateParent(this, this.events.parentSet));
      this.getRoot = () => {
        let curr = this;
        while(curr.parentAssembly() !== undefined) {
          curr = curr.parentAssembly();
        }
        return curr;
      }
    }

    function runCustomFunctions(code, value) {
      for (let index = 0; index < customFuncs; index++) {
        const customVal = customFuncs[index](code, value);
        if(customVal) return customVal;
      }
    }

    const parentJson = this.toJson;
    this.toJson = () => {
      const json = (typeof parentJson) === 'function' ? parentJson() : {};
      json.value = {values: Object.toJson(this.value.values)};
      return json;
    }

    // TODO: change (key, value, raw) -> ..., (key, rawOvalue)
    this.value = (key, value, raw) => {
      try {
        const formatted = (typeof this.value.keyFormatter) === 'function' ? this.value.keyFormatter(key) : undefined;
        if (formatted !== undefined) key = formatted;
        const customVal = runCustomFunctions(key, value)
        if(customVal !== undefined) return customVal;

        const currVal = Object.pathValue(this.value.values, key);
        if (value !== undefined && value !== key) {
          if (value !== currVal) {
            Object.pathValue(this.value.values, key, value);
            this.trigger.change();
          }
        } else {
          if (currVal !== undefined && currVal !== null) {
            const evaluator = this.value.evaluators[(typeof currVal)];
            if (!raw && evaluator) return evaluator(currVal);
            return currVal;
          }
        }
      } catch (e) {
        console.error(`Failed to resolve key: '${key}'`);
        throw e;
        return NaN;
      }
    }
    this.value.on = {change: this.on.change}
    this.value.all = (valueObj) => {
      Object.merge(this.value.values, valueObj);
    }

    this.hash = () => {
      const valueObj = this.value.values;
      const keys = Object.keys(valueObj).sort();
      let hash = 0;
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        hash += new String(valueObj[key]).hash()
      }
      return hash;
    }


    this.value.values = {};
    this.value.evaluators = properties.evaluators || {};
    this.value.defaultFunction = properties.defaultFunction;
    this.value.keyFormatter = properties.keyFormatter;
    this.value.parentAttribute = () => parentAttr;
    this.value.childrenAttribute = () => childAttr;
    this.value.addCustomFunction = (func) => (typeof func) === 'function' && customFuncs.push(func);

    this.value.getterSetter = (code, _rawOvalue, preProcessor) => (rawOvalue) => {
      if (!Boolean.is(rawOvalue)) {
        if (rawOvalue !== undefined) this.value(code, rawOvalue);
        rawOvalue = _rawOvalue;
      }
      const value = this.resolve(code, rawOvalue);
      return preProcessor instanceof Function ? preProcessor(value) : value;
    }
  }
}

module.exports = KeyValue;
