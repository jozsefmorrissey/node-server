

const DecisionTree = require('./decision-tree');
const DataSync = require('./data-sync');
const Lookup = require('./object/lookup');

const INTERNAL_FUNCTION_PASSWORD = String.random();
const DEFAULT_GROUP = 'LogicTree';

function getNode(nodeOwrapper) {
  if (nodeOwrapper.constructor.name === 'DecisionNode') return nodeOwrapper;
  return nodeOwrapper.node;
}

class LogicWrapper extends Lookup {
  constructor(node) {
    super(node ? node.nodeId() : undefined, 'nodeId');
    this.node = node;
  }
}

class LogicType {
  constructor(wrapperOrJson) {
    Object.getSet(this, 'nodeId', 'optional', 'value', 'default');
    this.wrapper = wrapperOrJson instanceof LogicWrapper ?
                      wrapperOrJson :
                      LogicWrapper.get(wrapperOrJson.nodeId);
    this.nodeId(this.wrapper.node.nodeId());
    let optional = false;
    this.optional = (val) => {
      if (val === true || val === false) {
        optional = val;
      }
      return optional;
    }
    this.selectionMade = () => true;
  }
}

class SelectLogic extends LogicType {
  constructor(wrapper) {
    super(wrapper);
    const json = wrapper;
    wrapper = this.wrapper;
    let value, def;
    const instance = this;
    this.madeSelection = () => validate(value, true) || validate(def, true);
    function validate(val, silent) {
      if (instance.optional() && val === null) return true;
      const valid = (instance.optional() && val === null) ||
                    (val !== null && wrapper.node.validState(val));
      if (!silent && !valid)
        throw SelectLogic.error;
      return valid;
    }
    this.value = (val, password) => {
      if (val !== undefined) {
        validate(val);
        value = val;
        wrapper.valueUpdate(value, wrapper);
      }
      return value === undefined ? (def === undefined ? null : def) : value;
    }
    this.selectionMade = () => value !== undefined;
    this.options = () => {
      return wrapper.node.stateNames();
    }
    this.default = (val, password) => {
      if (val !== undefined) {
        validate(val);
        def = val;
        wrapper.defaultUpdate(value, wrapper);
      }
      return def;
    }
    this.selector = () => this.value();
   }
}

SelectLogic.error = new Error('Invalid selection: use wrapper.options() to get valid list.')

class MultiselectLogic extends LogicType {
  constructor(wrapper) {
    super(wrapper);
    wrapper = this.wrapper;
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
      if (!silent && !valid) throw MultiselectLogic.error;
      return valid;
    }
    this.value = (val, password) => {
      if (val !== undefined) {
        validate(val);
        value = val;
        wrapper.valueUpdate(value);
      }
      let retVal = value === undefined ? def : value;
      return retVal === null ? null : JSON.clone(retVal);
    }
    this.selectionMade = () => value !== undefined;
    this.options = () => {
      const options = {};
      const stateNames = wrapper.node.stateNames();
      stateNames.forEach((name) => options[name] = def[name] === undefined ? false : def[name]);
      return options;
    }
    this.default = (val, password) => {
      if (val !== undefined) {
        validate(val);
        def = val;
        wrapper.defaultUpdate(value);
      }
      return def;
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
MultiselectLogic.error = new Error('Invalid multiselection: use wrapper.options() to get valid list.')


class ConditionalLogic extends LogicType {
  constructor(wrapper) {
    super(wrapper);
    wrapper = this.wrapper;
    let value, def;
    validate(wrapper.node.payload());
    def = wrapper.node.payload();
    function validate(val, password) {
      if ((typeof val.condition) !== 'function')
        throw ConditionalLogic.error;
    }
    this.value = (val) => {
      if (val !== undefined) {
        validate(val);
        value = val;
        wrapper.valueUpdate(value);
      }
      return value || def;
    }
    this.options = () => undefined;
    this.default = (val, password) => {
      if (val !== undefined) {
        validate(val);
        def = val;
        wrapper.defaultUpdate(value);
      }
      return def;
    }
    this.selector = () => () => this.value().condition(wrapper.root());
  }
}
ConditionalLogic.error = new Error('Invalid condition: must be a function that returns true or false based off of node input');

class BranchLogic extends LogicType {
  constructor(wrapper) {
    super(wrapper);
    this.value = () => undefined;
    this.options = () => undefined;
    this.default = () => undefined;
    this.selector = () => /.*/;
  }
}

class LeafLogic extends LogicType {
  constructor(wrapper) {
    super(wrapper);
    this.value = () =>undefined;
    this.options = () => undefined;
    this.default = () => undefined;
    this.selector = () => undefined;
  }
}

LogicType.types = {SelectLogic, MultiselectLogic, ConditionalLogic, BranchLogic, LeafLogic};
class LogicTree {
  constructor(formatPayload) {
    Object.getSet(this);
    const tree = this;
    let root;
    let choices = {};
    const wrapperMap = {};

    function getTypeObjByNodeId(nodeId) {
      return choices[get(nodeId).name];
    }
    let dataSync = new DataSync('nodeId', getTypeObjByNodeId);
    dataSync.addConnection('value');
    dataSync.addConnection('default');

    function isOptional(node) {
      return !(choices[node.name] === undefined || !choices[node.name].optional());
    }

    function isSelector(node) {
      return node.payload().LOGIC_TYPE.match(/Select|Multiselect/);
    }

    function mustSelect(node) {
      return !isOptional(node)  && node.payload().LOGIC_TYPE.match(/Select|Multiselect/);
    }

    function structure() { return root.node.toString(null, 'LOGIC_TYPE') }

    function setChoice(name, val) {
      choices[name].value(val);
    }

    function setDefault(name, val) {
      choices[name].default(val);
    }

    function getByName(name) {
      if (root.node === undefined) return undefined;
      const node = root.node.getByName(name);
      return node === undefined ? undefined : wrapNode(node);
    }

    function addChildrenFunc(wrapper, options) {
      return (name) => {
        const targetWrapper = getByName(name);
        if (targetWrapper === undefined) throw new Error(`Invalid name: ${name}`);
        const states = targetWrapper.node.states();
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

    function reachableTree(node) {
      return (node || root.node).subtree(choicesToSelectors());
    }

    function leaves() {
      const wrappers = [];
      reachableTree().leaves().forEach((node) => wrappers.push(wrapNode(node)));
      return wrappers;
    }

    function pathsToString() {
      let paths = '=>';
      forPath((wrapper, data) => {
        if (data === undefined) paths = paths.substring(0, paths.length - 2) + "\n";
        paths += `${wrapper.name}=>`;
        return true;
      });
      paths = paths.substring(0, paths.length - 2)
      return paths;
    }

    function forPath(func, reverse) {
      const lvs = reachableTree().leaves();
      let data = [];
      let dIndex = 0;
      lvs.forEach((leave) => {
        const path = [];
        let curr = leave;
        while (curr !== undefined) {
          path.push(curr);
          curr = curr.back()
        }
        if (reverse === true) {
          for (let index = 0; index < path.length; index += 1) {
            data[dIndex] = func(wrapNode(path[index]), data[dIndex]);
          }
        } else {
          for (let index = path.length - 1; index >= 0; index -= 1) {
            data[dIndex] = func(wrapNode(path[index]), data[dIndex]);
          }
        }
        dIndex++;
      });
      return data;
    }

    function forAll(func, node) {
      (node || root.node).forEach((n) => {
        func(wrapNode(n));
      });
    }

    function forEach(func, node) {
      reachableTree(node).forEach((n) => {
        func(wrapNode(n));
      });
    }

    function reachable(nameOwrapper) {
      const wrapper = nameOwrapper instanceof LogicWrapper ?
                        nameOwrapper : getByName(nameOwrapper);
      return wrapper.node.conditionsSatisfied(choicesToSelectors(), wrapper.node);
    }

    function isComplete() {
      const subtree = reachableTree();
      let complete = true;
      subtree.forEach((node) => {
        if (node.states().length === 0 && node.payload().LOGIC_TYPE !== 'Leaf' &&
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
        if (getTypeObj(wrapper) === undefined) {
          throw new Error ('This should not happen. node wrapper was not made correctly.');
        }
        return getTypeObj(wrapper).madeSelection();
      }
      return true;
    }

    function getByPath(...args) {
      return wrapNode(root.node.getNodeByPath(...args))
    }
    this.getByPath = getByPath;

    function decisions(wrapper) {
      return () =>{
        const decisions = [];
        const addedNodeIds = [];
        const selectors = choicesToSelectors();
        wrapper.node.forEach((node) => {
          if (isSelector(node)) {
            let terminatedPath = false;
            let current = node;
            while (current = current.back()){
              if (addedNodeIds.indexOf(current.nodeId()) !== -1)
                terminatedPath = true;
            }
            if (!terminatedPath) {
              if (node.conditionsSatisfied(selectors, node)) {
                if (selectionMade(node, selectors)) {
                  decisions.push(wrapNode(node));
                } else {
                  decisions.push(wrapNode(node));
                  addedNodeIds.push(node.nodeId());
                }
              }
            }
          }
        });
        return decisions;
      }
    }

    function toJson(wrapper) {
      return function () {
        wrapper = wrapper || root;
        const json = {_choices: {}, _TYPE: tree.constructor.name};
        const keys = Object.keys(choices);
        const ids = wrapper.node.map((node) => node.nodeId());
        keys.forEach((key) => {
          if (ids.indexOf(choices[key].nodeId()) !== -1) {
            json._choices[key] = choices[key].toJson();
            const valEqDefault = choices[key].default() === choices[key].value();
            const selectionNotMade = !choices[key].selectionMade();
            if(selectionNotMade || valEqDefault) json._choices[key].value = undefined;
          }
        });
        json._tree = wrapper.node.toJson();
        json._connectionList = dataSync.toJson(wrapper.node.nodes());
        return json;
      }
    }

    function children(wrapper) {
      return () => {
        const children = [];
        wrapper.node.forEachChild((child) => children.push(wrapNode(child)));
        return children;
      }
    }

    function addStaticMethods(wrapper) {
      wrapper.structure = structure;
      wrapper.choicesToSelectors = choicesToSelectors;
      wrapper.setChoice = setChoice;
      wrapper.children = children(wrapper);
      wrapper.getByPath = getByPath;
      wrapper.setDefault = setDefault;
      wrapper.attachTree = attachTree(wrapper);
      wrapper.toJson = toJson(wrapper);
      wrapper.root = () => root;
      wrapper.isComplete = isComplete;
      wrapper.reachable = (wrap) => reachable(wrap || wrapper);
      wrapper.decisions = decisions(wrapper);
      wrapper.forPath = forPath;
      wrapper.forEach = forEach;
      wrapper.forAll = forAll;
      wrapper.pathsToString = pathsToString;
      wrapper.leaves = leaves;
      wrapper.toString = () =>
          wrapper.node.subtree(choicesToSelectors()).toString(null, 'LOGIC_TYPE');
    }

    function getTypeObj(wrapper) {
      return choices[wrapper.name];
    }

    function addHelperMetrhods (wrapper) {
      const node = wrapper.node;
      const type = node.payload().LOGIC_TYPE;
      const name = node.name;
      if (choices[name] === undefined) {
        choices[name] = new (LogicType.types[`${type}Logic`])(wrapper);
      }
      const typeObj = choices[name];
      wrapper.name = name;
      wrapper.getTypeObj = () => getTypeObj(wrapper);
      wrapper.value = typeObj.value;
      wrapper.payload = () => node.payload();
      wrapper.options = typeObj.options;
      wrapper.optional = typeObj.optional;
      wrapper.default = typeObj.default;
      wrapper.selector = typeObj.selector;
      wrapper.addChildren = addChildrenFunc(wrapper);
      wrapper.valueSync = (w) => dataSync.valueSync(typeObj, w.getTypeObj());
      wrapper.defaultSync = (w) => dataSync.defaultSync(typeObj, w.getTypeObj());
      wrapper.valueUpdate = (value) => dataSync.valueUpdate(value, typeObj);
      wrapper.defaultUpdate = (value) => dataSync.defaultUpdate(value, typeObj);
    }

    function attachTree(wrapper) {
      return (tree) => {
        const json = tree.toJson();
        return incorrperateJsonNodes(json, wrapper.node);
      }
    }

    function addTypeFunction(type, wrapper) {
      wrapper[type.toLowerCase()] = (name, payload) => {
        payload = typeof formatPayload === 'function' ?
                          formatPayload(name, payload || {}, wrapper) : payload || {};
        payload.LOGIC_TYPE = type;
        let newWrapper;
        if (root === undefined) {
          root = wrapper;
          root.node = new DecisionTree(name, payload);
          root.payload = root.node.payload;
          newWrapper = root;
        } else if (getByName(name)) {
          newWrapper = wrapNode(wrapper.node.then(name));
        } else {
          wrapper.node.addState(name, payload);
          newWrapper = wrapNode(wrapper.node.then(name));
        }
        return newWrapper;
      }
    }

    function getNode(nodeOrwrapperOrId) {
      switch (nodeOrwrapperOrId.constructor.name) {
        case 'DecisionNode':
          return nodeOrwrapperOrId;
        case 'LogicWrapper':
          return nodeOrwrapperOrId.node;
        default:
          const node = DecisionTree.DecisionNode.get(nodeOrwrapperOrId);
          if (node) return node;
          return nodeOrwrapperOrId;
      }
    }

    function get(nodeOidOwrapper) {
      if (nodeOidOwrapper === undefined) return undefined;
      const node = getNode(nodeOidOwrapper);
      if (node instanceof DecisionTree.DecisionNode) {
        return wrapperMap[node.nodeId()];
      } else {
        return wrapperMap[node];
      }
    }

    const set = (wrapper) =>
        wrapperMap[wrapper.node.nodeId()] = wrapper;
    this.get = get;

    function wrapNode(node) {
      let wrapper = get(node);
      if (wrapper) return wrapper;
      wrapper = new LogicWrapper(node);
      if (node === undefined) {
        wrapper.toString = () =>
          root !== undefined ? root.toString() : 'Empty Tree';
      }
      if (node === undefined || node.payload().LOGIC_TYPE !== 'Leaf') {
        addTypeFunction('Select', wrapper);
        addTypeFunction('Multiselect', wrapper);
        addTypeFunction('Conditional', wrapper);
        addTypeFunction('Leaf', wrapper);
        addTypeFunction('Branch', wrapper);
      }
      addStaticMethods(wrapper);
      if (node && node.payload().LOGIC_TYPE !== undefined) {
        addHelperMetrhods(wrapper);
        set(wrapper);
      }
      return wrapper;
    }

    function updateChoices(jsonChoices) {
      const keys = Object.keys(jsonChoices);
      keys.forEach((key) =>
          choices[key].fromJson(jsonChoices[key]));
    }

    function incorrperateJsonNodes(json, node) {
      const decisionTree = new DecisionTree(json._tree);

      let newNode;
      if (node !== undefined) {
        newNode = node.attachTree(decisionTree);
      } else {
        root = wrapNode(decisionTree);
        rootWrapper.node = root.node;
        newNode = root.node;
      }
      newNode.forEach((n) =>
          wrapNode(n));
      dataSync.fromJson(json._connectionList);
      updateChoices(json._choices);
      return node;
    }

    let rootWrapper = wrapNode();
    if (formatPayload && formatPayload._TYPE === this.constructor.name) incorrperateJsonNodes(formatPayload);
    return rootWrapper;
  }
}

LogicTree.LogicWrapper = LogicWrapper;

module.exports = LogicTree;
