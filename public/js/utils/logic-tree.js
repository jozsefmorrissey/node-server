


const DecisionTree = require('./decision-tree');

const INTERNAL_FUNCTION_PASSWORD = String.random();
const DEFAULT_GROUP = 'LogicTree';

function getNode(nodeOwrapper) {
  if (nodeOwrapper.constructor.name === 'DecisionNode') return nodeOwrapper;
  return nodeOwrapper.node;
}

class LogicType {
  constructor() {
    let optional = false;
    this.optional = (val) => {
      if (val === true || val === false) {
        optional = val;
      }
      return optional;
    }
  }
}

class Select extends LogicType {
  constructor(wrapper) {
    super();
    let value, def;
    const instance = this;
    this.madeSelection = () => validate(value, true) || validate(def, true);
    function validate(val, silent) {
      if (instance.optional() && val === null) return true;
      const valid = (instance.optional() && val === null) ||
                    (val !== null && wrapper.node.validState(val));
      if (!silent && !valid) throw Select.error;
      return valid;
    }
    this.value = (val, password) => {
      if (val !== undefined) {
        validate(val);
        value = val;
        LogicTree.updateValues(wrapper, password);
      }
      return value === undefined ? (def === undefined ? null : def) : value;
    }
    this.options = () => {
      return wrapper.node.stateNames();
    }
    this.default = (val, password) => {
      if (val !== undefined) {
        validate(val);
        def = val;
        LogicTree.updateDefaults(wrapper, password);
      }
      return def;
    }
    this.selector = () => this.value();
   }
}

Select.error = new Error('Invalid selection: use wrapper.options() to get valid list.')

class Multiselect extends LogicType {
  constructor(wrapper) {
    super();
    let value, def;
    const instance = this;
    this.madeSelection = () => validate(value, true) || validate(def, true);
    function validate(val, silent) {
      if (val === null) return instance.optional();
      if (val === undefined) return false;
      const stateNames = Object.keys(val);
      if (instance.optional() && stateNames.length === 0) return true;
      let valid = stateNames.length > 0;
      stateNames.forEach((name) => valid = valid && wrapper.node.validState(name));
      if (!silent && !valid) throw Multiselect.error;
      return valid;
    }
    this.value = (val, password) => {
      if (val !== undefined) {
        validate(val);
        value = val;
        LogicTree.updateValues(wrapper, password);
      }
      const retVal = value === undefined ? def : value;
      return retVal === null ? null : JSON.clone(retVal);
    }
    this.options = () => {
      const options = {};
      const stateNames = wrapper.node.stateNames();
      stateNames.forEach((name) => options[name] = def[name] === undefined ? false : def[name]);
      return options;
    }
    this.default = (val, password) => {
      validate(val);
      def = val;
      LogicTree.updateDefaults(wrapper, password);
    }
    this.selector = () => {
      const obj = this.value();
      if (obj === null || obj === undefined) return null;
      const keys = Object.keys(obj);
      let selector = '';
      keys.forEach((key) => selector += obj[key] ? `|${key}` : '');
      selector = selector.length === 0 ? null : new RegExp(`^${selector.substring(1)}$`);
      return selector;
    }
  }
}
Multiselect.error = new Error('Invalid multiselection: use wrapper.options() to get valid list.')


class Conditional extends LogicType {
  constructor(wrapper) {
    super();
    let value, def;
    function validate(val, password) {
      if ((typeof val) !== 'function') throw Conditional.error;
    }
    this.value = (val) => {
      if (val !== undefined) {
        validate(val);
        value = val;
        LogicTree.updateValues(wrapper, password);
      }
      return value || def;
    }
    this.options = () => undefined;
    this.default = (val, password) => {
      validate(val);
      def = val;
      LogicTree.updateDefaults(wrapper, password);
    }
    this.selector = () => this.value();
  }
}
Conditional.error = new Error('Invalid condition: must be a function that returns true or false based off of node input');

class Branch extends LogicType {
  constructor(wrapper) {
    super();
    this.value = () => undefined;
    this.options = () => undefined;
    this.default = () => undefined;
    this.selector = () => /.*/;
  }
}

class Leaf extends LogicType {
  constructor(wrapper) {
    super();
    this.value = () =>undefined;
    this.options = () => undefined;
    this.default = () => undefined;
    this.selector = () => undefined;
  }
}

LogicType.types = {Select, Multiselect, Conditional, Branch, Leaf};
class LogicTree {
  constructor(uniqueGroup) {
    let root;
    let choices = {};
    uniqueGroup = uniqueGroup || DEFAULT_GROUP;

    function isOptional(node) {
      return !(choices[node.name] === undefined || !choices[node.name].optional());
    }

    function isSelector(node) {
      return node.payload._TYPE.match(/Select|Multiselect/);
    }

    function mustSelect(node) {
      return !isOptional(node)  && node.payload._TYPE.match(/Select|Multiselect/);
    }

    function structure() { return root.node.toString(null, '_TYPE') }

    function setChoice(name, val) {
      choices[name].value(val);
    }

    function setDefault(name, val) {
      choices[name].default(val);
    }

    function addChildrenFunc(wrapper, options) {
      return (name) => {
        const targetWrapper = LogicTree.get(name, uniqueGroup);
        if (targetWrapper === undefined) throw new Error(`Invalid name: ${name}`);
        const states = Object.values(targetWrapper.node.states);
        states.forEach((state) => wrapNode(wrapper.node.then(state)));
        return wrapper;
      }
    }

    function choicesToSelectors() {
      const keys = Object.keys(choices);
      const selectors = {};
      keys.forEach((key) => selectors[key] = choices[key].selector());
      return selectors;
    }

    function reachableTree() {
      return root.node.subtree(choicesToSelectors());
    }

    function leaves() {
      const wrappers = [];
      reachableTree().leaves().forEach((node) => wrappers.push(wrapNode(node)));
      return wrappers;
    }

    function forPath(func, reverse) {
      const lvs = reachableTree().leaves();
      lvs.forEach((leave) => {
        const path = [];
        let curr = leave;
        while (curr !== undefined) {
          path.push(curr);
          curr = curr.back()
        }
      let data;
      if (reverse === true) {
        for (let index = 0; index < path.length; index += 1) {
          data = func(wrapNode(path[index]), data);
        }
      } else {
        for (let index = path.length - 1; index >= 0; index -= 1) {
          data = func(wrapNode(path[index]), data);
        }
      }
      });
    }

    function reachable(name) {
      const rTree = reachableTree();
      let canReach;
      rTree.forEach((node) => {
        if (!canReach) {
          const wrapper = wrapNode(node);
          if (wrapper.name === name) canReach = wrapper;
        }
      });
      return canReach;
    }

    function isComplete() {
      const subtree = reachableTree();
      let complete = true;
      subtree.forEach((node) => {
        if (Object.keys(node.states).length === 0 && node.payload._TYPE !== 'Leaf' &&
              !selectionMade(node)) {
          complete = false;
        }
      });
      return complete;
    }

    function selectionMade(node, selectors) {
      selectors = selectors || choicesToSelectors();
      if (mustSelect(node)) {
        const wrapper = wrapNode(node);
        if (wrapper.typeObject === undefined) {
          throw new Error ('This should not happen. node wrapper was not made correctly.');
        }
        return wrapper.typeObject.madeSelection();
      }
      return true;
    }

    function decisions(wrapper) {
      return () =>{
        const decisions = [];
        const addedNodeIds = [];
        const selectors = choicesToSelectors();
        wrapper.node.forEach((node) => {
          if (isSelector(node)) {
            let terminatedPath = false;
            let current = node;
            while (current = current.back())
            if (addedNodeIds.indexOf(current.nodeId) !== -1) terminatedPath = true;
            if (!terminatedPath) {
              if (node.conditionsSatisfy(selectors, node)) {
                if (selectionMade(node, selectors)) {
                  decisions.push(wrapNode(node));
                } else {
                  decisions.push(wrapNode(node));
                  addedNodeIds.push(node.nodeId);
                }
              }
            }
          }
        });
        return decisions;
      }
    }

    function addStaticMethods(wrapper) {
      wrapper.structure = structure;
      wrapper.setChoice = setChoice;
      wrapper.setDefault = setDefault;
      wrapper.isComplete = isComplete;
      wrapper.reachable = reachable;
      wrapper.decisions = decisions(wrapper);
      wrapper.forPath = forPath;
      wrapper.leaves = leaves;
      wrapper.toString = () =>
          wrapper.node.subtree(choicesToSelectors()).toString(null, '_TYPE');
    }

    function addHelperMetrhods (wrapper) {
      const node = wrapper.node;
      const type = node.payload._TYPE;
      const name = node.name;
      if (choices[name] === undefined) {
        choices[name] = new (LogicType.types[type])(wrapper);
      }
      const typeObj = choices[name];
      wrapper.name = name;
      wrapper.typeObject = typeObj;
      wrapper.value = typeObj.value;
      wrapper.options = typeObj.options;
      wrapper.optional = typeObj.optional;
      wrapper.default = typeObj.default;
      wrapper.selector = typeObj.selector;
      wrapper.addChildren = addChildrenFunc(wrapper);
      wrapper.connectValues = (w) => LogicTree.connectValues(wrapper, w);
      wrapper.connectDefaults = (w) => LogicTree.connectDefaults(wrapper, w);
    }

    function addTypeFunction(type, wrapper) {
      wrapper[type.toLowerCase()] = (name, payload) => {
        payload = payload || {};
        payload._TYPE = type;
        payload._UNIQUE_NAME_GROUP = uniqueGroup;
        let newWrapper;
        if (root === undefined) {
          root = wrapper;
          root.node = new DecisionTree(name, payload);
          newWrapper = root;
          LogicTree.register(payload._UNIQUE_NAME_GROUP, name, newWrapper);name
        } else if (LogicTree.get(name, uniqueGroup)) {
          newWrapper = wrapNode(wrapper.node.then(name));
        } else {
          wrapper.node.addState(name, payload);
          newWrapper = wrapNode(wrapper.node.then(name));
          LogicTree.register(uniqueGroup, name, newWrapper);
        }
        return newWrapper;
      }
    }

    function wrapNode(node) {
      let wrapper = LogicTree.wrapper(node);
      if (wrapper) return wrapper;
      wrapper = {node};
      if (node !== undefined) {
        const payload = () => node.payload();
        const back = () => node.back();
        const top = () => node.top();
      } else {
        wrapper.toString = () =>
          root !== undefined ? root.toString() : 'Empty Tree';
      }
      if (node === undefined || node.payload._TYPE !== 'Leaf') {
        addTypeFunction('Select', wrapper);
        addTypeFunction('Multiselect', wrapper);
        addTypeFunction('Conditional', wrapper);
        addTypeFunction('Leaf', wrapper);
        addTypeFunction('Branch', wrapper);
      }
      addStaticMethods(wrapper);
      if (node && node.payload._TYPE !== undefined) {
        addHelperMetrhods(wrapper);
      }
      LogicTree.wrapper(wrapper, INTERNAL_FUNCTION_PASSWORD);
      return wrapper;
    }


    return wrapNode();
  }
}

{
  const declaired = {};
  const connectedValues = {};
  const connectedDefaults = {};
  const idMap = {};
  const wrapperMap = {};

  function connectNodes(node1, node2, attr, map) {
    let id;
    node1 = getNode(node1);
    node2 = getNode(node2);
    idMap[node1.nodeId] = idMap[node1.nodeId] || {};
    idMap[node2.nodeId] = idMap[node2.nodeId] || {};
    if (idMap[node1.nodeId][attr] === undefined) {
      if (idMap[node2.nodeId][attr] === undefined) {
        id = String.random();
      } else {
        id = idMap[node2.nodeId][attr];
      }
    } else { id = idMap[node1.nodeId][attr]; }
    idMap[node1.nodeId][attr] = id;
    idMap[node2.nodeId][attr] = id;
    map[id] = map[id] || [];
    if (map[id].indexOf(node1) === -1) {
      map[id].push(node1)
    }
    if (map[id].indexOf(node2) === -1) {
      map[id].push(node2)
    }
  }

  function updateConnected(wrapper, password, attr, map) {
    if (idMap[wrapper.node.nodeId] === undefined ||
          password === INTERNAL_FUNCTION_PASSWORD) return;
    const id = idMap[wrapper.node.nodeId][attr];
    const connected = map[id] || [];
    const value = wrapper[attr]();
    connected.forEach((node) => {
      const wrapper2 = LogicTree.wrapper(node);
      wrapper2[attr](value, INTERNAL_FUNCTION_PASSWORD);
    });
  }

  LogicTree.register = (group, name, wrapper) => {
    if (declaired[group] === undefined) declaired[group] = {};
    if (declaired[group][name] !== undefined) throw new Error('This should not happen: check addTypeFunction logic');
    declaired[group][name] = wrapper;
  }
  LogicTree.get = (name, group) =>  declaired[group || DEFAULT_GROUP][name];
  LogicTree.connectValues =
    (node1, node2) => connectNodes(node1, node2, 'value', connectedValues);
  LogicTree.connectDefaults =
    (node1, node2) => connectNodes(node1, node2, 'default', connectedDefaults);
  LogicTree.updateValues =
    (wrapper, password) => updateConnected(wrapper, password, 'value', connectedValues);
  LogicTree.updateDefaults =
    (wrapper, password) => updateConnected(wrapper, password, 'default', connectedDefaults);

  LogicTree.wrapper = (nodeOwrapper, wrapperConstId) => {
    if (nodeOwrapper === undefined) return undefined;
    if (nodeOwrapper.constructor.name === 'DecisionNode') {
      return wrapperMap[nodeOwrapper.nodeId];
    } else if (INTERNAL_FUNCTION_PASSWORD !== wrapperConstId) {
      throw new Error('External uses of \'LogicTree.wrapper(node)\' can only be used as a getter. Setting values is functionality reserved only for internal logic.')
    }
    if (nodeOwrapper.node !== undefined) {
      if (wrapperMap[nodeOwrapper.node.nodeId] !== undefined) {
        throw new Error('All nodes should only be wrapped once to accuratly persist data');
      }
      wrapperMap[nodeOwrapper.node.nodeId] = nodeOwrapper;
    }
  }
  LogicTree.wrappedIds = () => Object.keys(wrapperMap);
}

module.exports = LogicTree;
