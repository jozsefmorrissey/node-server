
const Lookup = require('./lookup');
const Notifiction = require('../collections/notification.js');
const NotifictionArray = Notifiction.Array;
const CustomEvent = require('../custom-event.js');

function updateParent(keyValue, event) {
  return (target, detail) => {
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
    const customFuncs = [];
    const parentSetEvent = new CustomEvent('parent-set');


    if (childAttr) {
      if (properties.object) this[childAttr] = new Notifiction(false);
      else this[childAttr] = new NotifictionArray(false);
      this[childAttr].onAfterChange(updateParent(this, parentSetEvent));
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

    this.on ||= {};
    this.on.parentSet = parentSetEvent.on;
    this.trigger ||= {};
    this.trigger.parentSet = parentSetEvent.trigger;
    this.value = (key, value) => {
      try {
        const formatted = (typeof this.value.keyFormatter) === 'function' ? this.value.keyFormatter(key) : undefined;
        if (formatted !== undefined) key = formatted;
        const customVal = runCustomFunctions(key, value)
        if(customVal !== undefined) return customVal;

        if (value !== undefined) {
          if (value !== this.value.values[key]) {
            this.value.values[key] = value;
            changeEvent.trigger();
          }
        } else {
          const instVal = this.value.values[key];
          if (instVal !== undefined && instVal !== null) {
            const evaluator = this.value.evaluators[(typeof instVal)];
            if (evaluator) return evaluator(instVal);
            return instVal;
          }
          const parent = this[parentAttr]();
          if (parent) return parent.value(key);
          else {
            const defaultFunction = this.value.defaultFunction;
            if (defaultFunction) {
              value = (typeof this.value.defaultFunction) === 'function' ? this.value.defaultFunction(key, value) : undefined;
              if (value === undefined) throw new Error();
              return value;
            }
          }
        }
      } catch (e) {
        console.error(`Failed to resolve key: '${key}'`);
        throw e;
        return NaN;
      }
    }
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

    let changeEvent = new CustomEvent('change');
    this.value.onChange = changeEvent.on;

    this.value.values = {};
    this.value.evaluators = properties.evaluators || {};
    this.value.defaultFunction = properties.defaultFunction;
    this.value.keyFormatter = properties.keyFormatter;
    this.value.parentAttribute = () => parentAttr;
    this.value.childrenAttribute = () => childAttr;
    this.value.addCustomFunction = (func) => (typeof func) === 'function' && customFuncs.push(func);
  }
}

module.exports = KeyValue;
