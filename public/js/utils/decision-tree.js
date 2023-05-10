

const Lookup = require('./object/lookup')
const REMOVAL_PASSWORD = String.random();

function getByName(node, ...namePath) {
  for (let index = 0; index < namePath.length; index++) {
    node = node.next(namePath[index]);
    if (node === undefined) return;
  }
  return node;
}

function getById(node, ...idPath) {
  for (let index = 0; index < endIndex; index++) {
    node = node.child(idPath[index]);
    if (node === undefined) return;
  }
  return node;
}

function formatName(name) {
  if (name === undefined || name === '') return;
  return new String(name).toString();
}
class StateConfig extends Lookup {
  constructor(name, payload) {
    super();
    name = formatName(name)
    Object.getSet(this, {name, payload});
    const states = [];
    payload = payload || {};
    const instance = this;
    this.setValue = (key, value) => payload[key] = value;
    this.states = () => Array.from(states);
    this.payload = () => JSON.clone(payload);
    this.isLeaf = () => states.length === 0;
    this.stateNames = () => states.map(s => s.name());
    this.stateMap = () => states.idObject('name');
    this.validState = (n) => !!this.stateMap()[n];
    this.remove = (stateConfig) => states.remove(stateConfig);
    this.then = (stateConfig) => {
      if (this.validState(stateConfig.name())) return null;
      states.push(stateConfig);
    }

    this.toString = (tabs) => {
      const tab = new Array(tabs).fill('  ').join('');
      return `${tab}name: ${this.name()}\n${tab}states: ${this.stateNames()}`;
    }
  }
}

StateConfig.fromJson = (json) => {
  const id = json.id;
  const existing = StateConfig.get(id);
  if (existing) return existing;
  return new StateConfig(json.name, json.payload);
}


const payloadMap = {};
// terminology
// name - String to define state;
// payload - data returned for a given state
// node - {name, states, payload, then};
// then(name, payload:optional) - a function to set a following state.
// next(name) - a function to get the next state.
// back() - a function to move back up the tree.
// root() - a function to get root;
class DecisionNode extends Lookup {
  constructor(stateConfig, payload, parent) {
    super();
    const instance = this;
    const stateMap = {};
    payload = payload || {};
    if (payloadMap[payload.PAYLOAD_ID]) payload = payloadMap[payload.PAYLOAD_ID];
    else {
      payload.PAYLOAD_ID ||= String.random();
      payloadMap[payload.PAYLOAD_ID] = payload;
    }
    this.parent = () => parent;

    this.stateConfig = () => stateConfig;
    this.name = stateConfig.name;
    this.states = stateConfig.states;
    this.stateMap = () => stateMap;
    this.isLeaf = stateConfig.isLeaf;
    this.stateNames = stateConfig.stateNames;
    this.getById = (...idPath) => getById(this, ...idPath);
    this.getByName = (...namePath) => getByName(this, ...namePath);

    this.setValue = (key, value) => payload[key] = value;

    this.payload = (noConfig) => {
      if (noConfig) return payload;
      const copy = stateConfig.payload();
      Object.keys(payload).forEach((key) => {
        copy[key] = payload[key];
      });
      copy.node = this;
      return copy;
    };

    const shouldRecurse = () => Object.keys(stateMap) > 0 || !instance.selfReferencingPath();

    function attachTree(treeOnode) {
      if (shouldRecurse()) {
        const node = treeOnode instanceof DecisionNode ? treeOnode : treeOnode.root();
        return node.subtree(instance);
      }
    }

    function createNode(name, payload) {
      const node = stateMap[name];
      if (node) return node;
      const tree = instance.tree();
      const stateCreated = !tree.stateConfigs()[name];
      const stateConfig = tree.getState(name, payload);
      instance.stateConfig().then(stateConfig);
      if (stateCreated) payload = {};
      return new (tree.constructor.Node)(stateConfig, payload, instance)
    }

    this.then = (name, payload) => {
      if (name instanceof DecisionNode) return attachTree(name);
      if (Array.isArray(name)) {
        const returnNodes = [];
        for (let index = 0; index < name.length; index += 1) {
          returnNodes.push(this.then(formatName(name[index])));
        }
        return returnNodes;
      }
      name = formatName(name);
      const newState = createNode(name, payload);
      stateMap[name] = newState;

      return newState;
    }

    this.remove = () => this.back().stateConfig().remove(this.stateConfig());

    this.back = () => parent;
    this.tree = () => {
      let curr = this;
      while (!(curr instanceof DecisionTree)) curr = curr.back();
      return curr;
    };
    this.root = () => this.tree().root();
    this.isRoot = () => parent instanceof DecisionTree;

    // Breath First Search
    this.forEach = (func, conditions) => {
      if (this.reachable(conditions)) {
        const stateKeys = this.stateNames();
        func(this);
        if (shouldRecurse()) {
          for(let index = 0; index < stateKeys.length; index += 1) {
              const state = this.next(stateKeys[index]);
              state.forEach(func, conditions);
          }
        }
      }
    }

    this.next = (name) => {
      name = formatName(name);
      if (!stateConfig.validState(name)) throw new Error(`Invalid State: ${name}`);
      if (stateMap[name] === undefined) {
        stateMap[name] = createNode(name, null);
      }
      return stateMap[name];
    }

    this.forEachChild = (func, conditions) => {
      const stateKeys = this.stateNames();
      for(let index = 0; index < stateKeys.length; index += 1) {
        const state = this.next([stateKeys[index]]);
        func(state);
      }
    }
    this.children = () => {
      const children = [];
      this.forEachChild((child) => children.push(child));
      return children;
    }
    this.list = (filter, map, conditions) => {
      const list = [];
      const should = {filter: (typeof filter) === 'function', map: (typeof map) === 'function'};
      this.forEach((node) => {
        if (should.filter ? filter(node) : true) {
          list.push((should.map ? map(node) : node));
        }
      }, conditions);
      return list;
    };
    this.nodes = (conditions) => this.list(null, (node) => node, conditions);
    this.leaves = (conditions) => this.list((node) => node.isLeaf(), null, conditions);
    this.addChildren = (nodeOnameOstate) => {
      const nns = nodeOnameOstate;
      const stateConfig = nns instanceof DecisionNode ? nns.stateConfig() :
                nns instanceof StateConfig ? nns : this.tree().stateConfigs()[nns];
      if (!(stateConfig instanceof StateConfig)) throw new Error(`Invalid nodeOnameOstate '${nns}'`);
      const tree = this.tree();
      const states = stateConfig.states();
      states.forEach((state) => {
        tree.addState(stateConfig);
        this.then(state.name());
      });
      return this;
    }
    this.reachable = (conditions) => {
      if (this.isRoot()) return true;
      const parent = this.back();
      conditions = conditions || {};
      const cond = conditions[parent.name()] === undefined ?
                    conditions._DEFAULT : conditions[parent.name()];
      return DecisionTree.conditionSatisfied(cond, this)
    }
    this.child = (nodeId) => {
      const children = this.children();
      for (let index = 0; index < children.length; index++) {
        if (children[index].id() === nodeId) return children[index];
      }
    }
    function reached(node, nodeMap, conditions) {
      let reachable;
      do {
        reachable = node.reachable(conditions);
        if (reachable) {
          if (nodeMap[node.id()]) return true;
          nodeMap[node.id()] = node;
          node = node.back();
        }
      } while (reachable && node);
    }
    this.reachableFrom = (conditions, node) => {
      node ||= this.root();
      const nodeMap = {};
      nodeMap[node.id()] = node;
      return reached(this, nodeMap, conditions) || reached(node.back(), nodeMap, conditions);
    }
    this.subtree = (node) => {
      if (node === undefined) {
        const tree = new (this.tree().constructor)(this.name(), payload, this.tree().stateConfigs());
        tree.root().addSubtree(this, true);
        return tree.root();
      }
      node.addSubtree(this);
      return node;
    }
    this.path = () => {
      let path = [];
      let curr = this;
      while (!(curr instanceof DecisionTree)) {
        path.push(curr.name());
        curr = curr.back();
      }
      return path.reverse();
    }
    this.addSubtree = (node, recursive) => {
      if (!recursive) {
        node.tree().addStates(this.tree().stateConfigs());
      }
      const stateKeys = this.stateNames();

      if (shouldRecurse()) {
        shouldRecurse();
        for(let index = 0; index < stateKeys.length; index += 1) {
          const childNode = this.next(stateKeys[index]);
          const alreadyPresent = childNode.stateNames().indexOf(childNode.name());
          if (! alreadyPresent && !childNode.selfReferencingPath()) {
            node.then(childNode).addSubtree(childNode, true);
          }
        }
      }
      return node;
    }
    this.nodeOnlyToJson = () => {
      if (payload.toJson) payload = payload.toJson();
      const json = {name: this.name(), payload};

      json.children = {};
      if (shouldRecurse()) {
        this.children().forEach((child) => {
          json.children[child.name()] = child.nodeOnlyToJson();
        });
      }
      return json;
    }
    this.toJson = () => {
      const treeJson = this.tree().toJson(this);
      return treeJson;
    }
    this.equals = function (other) {
      if (!other || !(other instanceof DecisionNode)) return false;
      const config = this.stateConfig();
      const otherConfig = other.stateConfig();
      if (config !== otherConfig) return false;
      if (shouldRecurse()) {
        const states = config.stateNames();
        for (let index = 0; index < states.length; index++) {
          const state = states[index];
          if (!this.next(state).equals(other.next(state))) return false;
        }
      }
      return true;
    }
    this.parentCount = (name) => {
      let count = 0;
      let curr = this.back();
      while(!(curr instanceof DecisionTree)) {
        if (curr.name() === name) count++;
        curr = curr.back();
      }
      return count;
    }
    this.selfReferencingPath = () => {
      let names = {};
      let curr = this.back();
      while(!(curr instanceof DecisionTree)) {
        if (names[curr.name()]) return true;
        names[curr.name()] = true;
        curr = curr.back();
      }
      return false;
    }
    this.toString = (tabs, attr) => {
      tabs = tabs || 0;
      const tab = new Array(tabs).fill('  ').join('');
      let str = `${tab}${this.name()}`;
      let attrStr = this.payload()[attr];
      str += attrStr ? `) ${this.payload()[attr]}\n` : '\n';
      const stateKeys = this.stateNames();
      for(let index = 0; index < stateKeys.length; index += 1) {
        const stateName = stateKeys[index];
        const nextState = this.next(stateName);
        if (nextState.parentCount(stateName) < 2) {
          str += nextState.toString(tabs + 1, attr);
        }
      }
      return str;
    }
  }
}


class DecisionTree {
  constructor(name, payload, stateConfigs) {
    name = formatName(name);
    Object.getSet(this, {stateConfigs});
    const names = {};
    name = name || String.random();
    stateConfigs ||= {};
    this.stateConfigs = () => stateConfigs;
    const tree = this;

    const parentToJson = this.toJson;
    this.toJson = (node) => {
      node ||= this.root();
      const json = parentToJson();
      json.name = node.name();
      json.root = node.nodeOnlyToJson();
      return json;
    }

    this.nameTaken = (name) => stateConfigs[formatName(name)] !== undefined;

    function change(from, to) {
      const state = stateConfig[from];
      if (!state) throw new Error(`Invalid state name '${to}'`);
      state.name(to);
    }

    function getState(name, payload) {
      const stateConfig = stateConfigs[name];
      if (stateConfig) return stateConfig;
      return (stateConfigs[name] = new StateConfig(name, payload));
    }

    function addState(name, payload) {
      if (name instanceof StateConfig) {
        if (stateConfigs[name.name()] === undefined)
          return (stateConfigs[name.name()] = name);
        if (stateConfigs[name.name()] === name) return name;
        throw new Error(`Attempting to add a new state with name '${name.name()}' which is already defined`);
      }
      return getState(name, payload);
    }

    function addStates(states) {
      Object.keys(states).forEach((name) => getState(name, states[name]));
    }

    this.getById = (...idPath) => getById(this.root(), ...idPath);
    this.getByName = (...namePath) => getByName(this.root(), ...namePath);
    this.change = change;
    this.getState = getState;
    this.addState = addState;
    this.addStates = addStates;
    this.stateConfigs = () => stateConfigs;
    tree.declairedName = (name) => !!stateConfigs[formatName(name)];


    let instPld = payload;
    if (!this.nameTaken(name)) {
      instPld = {};
    }

    const rootNode = new (this.constructor.Node)(getState(name, payload), instPld, this);
    this.root = () => rootNode

    this.toString = (...args) => this.root().toString(...args);
    return this;
  }
}

DecisionTree.conditionSatisfied = (condition, state, value) => {
  value = value ? new String(value).toString() : state.name();
  const noRestrictions = condition === undefined;
  const regex = condition instanceof RegExp ? condition : null;
  const target = (typeof condition) === 'string' ? condition : null;
  const func = (typeof condition) === 'function' ? condition : null;
  return noRestrictions || (regex && value.match(regex)) ||
          (target !== null && value === target) ||
          (func && func(state, value));
}

function addChildren(node, json) {
  const childNames = Object.keys(json);
  for (let index = 0; index < childNames.length; index++) {
    const name = childNames[index];
    const payload = Object.fromJson(json[name].payload);
    const child = node.then(name, payload);
    addChildren(child, json[name].children);
  }
}

DecisionTree.fromJson = (json) => {
  const constructor = Object.class.get(json._TYPE);
  const stateConfigs = Object.fromJson(json.stateConfigs);
  const tree = new constructor(json.root.name, json.root.payload, stateConfigs);
  addChildren(tree.root(), json.root.children);
  return tree;
}

DecisionTree.DecisionNode = DecisionNode;
DecisionTree.Node = DecisionNode;
module.exports = DecisionTree;
