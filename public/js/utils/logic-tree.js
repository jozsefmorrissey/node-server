


const DecisionTree = require('./decision-tree');

const INTERNAL_FUNCTION_PASSWORD = String.random();
const DEFAULT_GROUP = 'LogicTree';

function getNode(nodeOwrapper) {
  if (nodeOwrapper.constructor.name === 'DecisionNode') return nodeOwrapper;
  return nodeOwrapper.node;
}

class LogicWrapper {constructor(node) {
  this.node = node;
}}

class LogicType {
  constructor(wrapperOrJson) {
    Object.getSet(this, 'nodeId', 'optional', 'value', 'default');
    this.wrapper = wrapperOrJson instanceof LogicWrapper ?
                      wrapperOrJson :
                      wrapper.get(wrapperOrJson.nodeId);
    this.wrapper.typeObject = this;
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
        LogicTree.updateValues(wrapper, password);
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
        LogicTree.updateDefaults(wrapper, password);
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
        LogicTree.updateValues(wrapper, password);
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
        LogicTree.updateDefaults(wrapper, password);
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
      if ((typeof val.condition) !== 'function') throw ConditionalLogic.error;
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
      if (val !== undefined) {
        validate(val);
        def = val;
        LogicTree.updateDefaults(wrapper, password);
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
  constructor(uniqueGroup) {
    // TODO: should eliminate uniqueGroup. trees should be completly disconnected.
    let json;
    if(uniqueGroup && uniqueGroup._TYPE === this.constructor.name) {
      json = uniqueGroup;
      uniqueGroup = json.uniqueGroup;
    }
    Object.getSet(this);
    const tree = this;
    let root;
    let choices = {};
    uniqueGroup = uniqueGroup || DEFAULT_GROUP;

    function changeType(node, newType, payload) {

    }

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

    function addChildrenFunc(wrapper, options) {
      return (name) => {
        const targetWrapper = LogicTree.get(name, uniqueGroup);
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

    function reachableTree() {
      return root.node.subtree(choicesToSelectors());
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

    function reachable(name) {
      const wrapper = LogicTree.get(name, uniqueGroup);
      return wrapper.node.conditionsSatisfy(choicesToSelectors(), wrapper.node);
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
        if (wrapper.typeObject === undefined) {
          throw new Error ('This should not happen. node wrapper was not made correctly.');
        }
        return wrapper.typeObject.madeSelection();
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
              if (node.conditionsSatisfy(selectors, node)) {
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
        const json = {choices: {}, _TYPE: tree.constructor.name, uniqueGroup};
        const keys = Object.keys(choices);
        const ids = wrapper.node.map((node) => node.nodeId());
        keys.forEach((key) => {
          if (ids.indexOf(choices[key].nodeId()) !== -1) {
            json.choices[key] = choices[key].toJson();
            const valEqDefault = choices[key].default() === choices[key].value();
            const selectionNotMade = !choices[key].selectionMade();
            if(selectionNotMade || valEqDefault) json.choices[key].value = undefined;
          }
        });
        json.tree = wrapper.node.toJson();
        json.connectionList = LogicTree.connectionList(wrapper);
        return json;
      }
    }

    function addStaticMethods(wrapper) {
      wrapper.structure = structure;
      wrapper.setChoice = setChoice;
      wrapper.getByPath = getByPath;
      wrapper.setDefault = setDefault;
      wrapper.attachTree = attachTree(wrapper);
      wrapper.toJson = toJson(wrapper);
      wrapper.root = () => root;
      wrapper.isComplete = isComplete;
      wrapper.reachable = reachable;
      wrapper.decisions = decisions(wrapper);
      wrapper.forPath = forPath;
      wrapper.pathsToString = pathsToString;
      wrapper.leaves = leaves;
      wrapper.destroyTree = () => LogicTree.destroy(wrapper);
      wrapper.toString = () =>
          wrapper.node.subtree(choicesToSelectors()).toString(null, 'LOGIC_TYPE');
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
      wrapper.typeObject = typeObj;
      wrapper.value = typeObj.value;
      wrapper.payload = () => node.payload();
      wrapper.options = typeObj.options;
      wrapper.optional = typeObj.optional;
      wrapper.default = typeObj.default;
      wrapper.selector = typeObj.selector;
      wrapper.addChildren = addChildrenFunc(wrapper);
      wrapper.connectValues = (w) => LogicTree.connectValues(wrapper, w);
      wrapper.connectDefaults = (w) => LogicTree.connectDefaults(wrapper, w);
    }

    function attachTree(wrapper) {
      return (tree) => {
        const json = tree.toJson();
        json.tree.payload._UNIQUE_NAME_GROUP = String.random();
        return incorrperateJsonNodes(json, wrapper.node);
      }
    }

    function addTypeFunction(type, wrapper) {
      wrapper[type.toLowerCase()] = (name, payload) => {
        payload = payload || {};
        payload.LOGIC_TYPE = type;
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

    const get = LogicTree.wrapper(uniqueGroup)
    const set = LogicTree.wrapper(uniqueGroup, INTERNAL_FUNCTION_PASSWORD)
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
      }
      set(wrapper);
      return wrapper;
    }

    function updateChoices(jsonChoices) {
      const keys = Object.keys(jsonChoices);
      keys.forEach((key) => choices[key].fromJson(jsonChoices[key]));
    }

    function incorrperateJsonNodes(json, node) {
      const decisionTree = new DecisionTree(json.tree);

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
      updateChoices(json.choices);
      LogicTree.addJsonConnections(json.connectionList);
      return node;
    }

    let rootWrapper = wrapNode();
    if (json) incorrperateJsonNodes(json);
    return rootWrapper;
  }
}

{
  const declaired = {};
  const connectedValues = {};
  const connectedDefaults = {};
  const idMap = {};
  const wrapperMap = {};
  const maps = {value: connectedValues, default: connectedDefaults};

  function getId(nodeOrwrapperOrId) {
    if (nodeOrwrapperOrId instanceof DecisionTree.DecisionNode) {
        return nodeOrwrapperOrId.nodeId();
    } else {
      return nodeOrwrapperOrId;
    }
  }

  function forEachConnectionList(wrapper, func) {
    wrapper.node.forEach((node) => {
      Object.keys(maps).forEach((mapKey) => {
        const map = maps[mapKey];
        const mapKeys = Object.keys(map);
        mapKeys.forEach((key) => {
            func(node, map, key, mapKey);
        });
      });
    });
  }

  function connectionList(wrapper) {
    const connections = {};
    const alreadyMapped = {};
    forEachConnectionList(wrapper, (node, map, key, mapKey) => {
      if(!alreadyMapped[mapKey]) {
        const nodeIndex = map[key].indexOf(node);
        const idIndex = map[key].indexOf(node.nodeId());
        let index = nodeIndex !== -1 ? nodeIndex : idIndex;
        if (index !== -1) {
          if(connections[mapKey] === undefined) connections[mapKey] = [];
          connections[mapKey].push(map[key].map((node) => node.nodeId()));
          alreadyMapped[mapKey] = true;
        }
      }
    });
    return connections;
  }

  function getNodeOrId(nodeOrwrapperOrId) {
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

  function connectNodes(node1, node2, attr, map) {
    let id;
    node1 = getNodeOrId(node1);
    node2 = getNodeOrId(node2);
    const node1Id = getId(node1);
    const node2Id = getId(node2);
    idMap[node1Id] = idMap[node1Id] || {};
    idMap[node2Id] = idMap[node2Id] || {};
    if (idMap[node1Id][attr] === undefined) {
      if (idMap[node2Id][attr] === undefined) {
        id = String.random();
      } else {
        id = idMap[node2Id][attr];
      }
    } else { id = idMap[node1Id][attr]; }
    idMap[node1Id][attr] = id;
    idMap[node2Id][attr] = id;
    map[id] = map[id] || [];
    if (map[id].indexOf(node1) === -1) {
      map[id].push(node1)
    }
    if (map[id].indexOf(node2) === -1) {
      map[id].push(node2)
    }
  }

  function addJsonConnections(connections) {
    const mapKeys = Object.keys(maps);
    mapKeys.forEach((key) => {
      const mapConns = connections[key] || [];
      mapConns.forEach((group) => {
        for (let index = 1; index < group.length; index += 1) {
          const nodeId1 = group[index - 1];
          const nodeId2 = group[index];
          connectNodes(nodeId1, nodeId2, key, maps[key]);
        }
      });
    });
  }

  function updateConnected(wrapper, password, attr, map) {
    if (idMap[wrapper.node.nodeId()] === undefined ||
          password === INTERNAL_FUNCTION_PASSWORD) return;
    const id = idMap[wrapper.node.nodeId()][attr];
    const connected = map[id] || [];
    const value = wrapper[attr]();
    connected.forEach((nodeOrId) => {
      const node = getNodeOrId(nodeOrId)
      if (node instanceof DecisionTree.DecisionNode) {
        const wrapper2 = LogicTree.wrapper(node.uniqueGroup)(node);
        wrapper2[attr](value, INTERNAL_FUNCTION_PASSWORD);
      }
    });
  }
  LogicTree.destroy = (wrapper) => {
    const uniqueGroup = wrapper.node.uniqueGroup;
    wrapper.node.forEach((node) => wrapperMap[uniqueGroup][node.nodeId()] = undefined);
    forEachConnectionList(wrapper, (node, map, key) => {
      let index = map[key].indexOf(node);
      if (index !== -1) map[key].splice(index, 1);
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

  LogicTree.wrapper = (uniqueGroup, wrapperConstId) => (nodeOidOwrapper) => {
    if (wrapperMap[uniqueGroup] === undefined) wrapperMap[uniqueGroup] = [];
    if (wrapperConstId === undefined) {
      if (nodeOidOwrapper === undefined) return undefined;
      const node = getNodeOrId(nodeOidOwrapper);
      if (node instanceof DecisionTree.DecisionNode) {
        return wrapperMap[uniqueGroup][node.nodeId()];
      }
    } else if (INTERNAL_FUNCTION_PASSWORD !== wrapperConstId) {
      throw new Error('External uses of \'LogicTree.wrapper(node)\' can only be used as a getter. Setting values is functionality reserved only for internal logic.')
    } else {
      if (nodeOidOwrapper.node !== undefined) {
        if (wrapperMap[uniqueGroup][nodeOidOwrapper.node.nodeId()] !== undefined) {
          throw new Error('All nodes should only be wrapped once to accuratly persist data');
        }
        wrapperMap[uniqueGroup][nodeOidOwrapper.node.nodeId()] = nodeOidOwrapper;
      }
    }
  }
  LogicTree.connectionList = connectionList;
  LogicTree.addJsonConnections = addJsonConnections;
}

module.exports = LogicTree;
