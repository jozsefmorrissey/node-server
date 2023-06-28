

const Lookup = require('./object/lookup')
const CustomEvent = require('./custom-event')
const Conditions = require('./conditions');
const REMOVAL_PASSWORD = String.random();

const nameEquals = (name) => (node) => node.name() === name;
const selectorFunc = (nameOfunc) => (typeof nameOfunc) === 'function' ?
                          nameOfunc : nameEquals(nameOfunc);


function getByPath(node, ...namePath) {
  for (let index = 0; index < namePath.length; index++) {
    node = node.next(namePath[index]);
    if (node === undefined) return;
  }
  return node;
}

function getByName(node, ...namePath) {
  for (let index = 0; index < namePath.length; index++) {
    const name = namePath[index];
    node = node.breathFirst(n => n.name() === name);
    if (node === undefined) return;
  }
  return node;
}

function formatName(name) {
  if (name === undefined || name === '') return;
  return new String(name).toString();
}
class StateConfig extends Lookup {
  constructor(name, payload, treeNameOrClass) {
    const treeClass = Object.class.get(treeNameOrClass);
    if (treeClass === undefined) throw new Error("Must have tree a treeClass in order to determine condition getter");
    const treeName = treeClass.name;
    super();
    name = formatName(name)
    Object.getSet(this, {name, payload, treeName});
    const states = [];
    payload = payload || {};
    const instance = this;
    this.setValue = (key, value) => payload[key] = value;
    this.states = () => Array.from(states);
    this.payload = () => Object.merge({}, payload);
    this.isLeaf = () => states.length === 0;
    this.stateNames = () => states.map(s => s.name());
    this.stateMap = () => states.idObject('name');
    this.validState = (n) => !!this.stateMap()[n];
    this.remove = (stateConfig) => states.remove(stateConfig);
    this.then = (stateConfig) => {
      if (this.validState(stateConfig.name())) return null;
      states.push(stateConfig);
    }

    Conditions.implement(this, treeClass.getCondition);

    this.toString = (tabs) => {
      const tab = new Array(tabs).fill('  ').join('');
      return `${tab}name: ${this.name()}\n${tab}states: ${this.stateNames()}`;
    }
  }
}
Object.class.register(StateConfig);

StateConfig.fromJson = (json) => {
  const id = json.id;
  const existing = StateConfig.get(id);
  if (existing) return existing;
  const payload = Object.fromJson(json.payload);
  const newState = new StateConfig(json.name, payload, json.treeName);
  json.conditions.forEach(c => newState.conditions.add(Object.fromJson(c), c.group));
  return newState;
}


const payloadMap = {};
// terminology
// name - String to define state;
// payload - data returned for a given state
// node - {name, states, payload, then};
// then(name, payload:optional) - a function to set a following state.
// next(name) - a function to get the next state.
// parent() - a function to move back up the tree.
// root() - a function to get root;
class DecisionNode extends Lookup {
  constructor(parentNodeOstateConfig, payload, parent) {
    super();
    const instance = this;
    const stateMap = {};
    payload = payload || {};
    if (payloadMap[payload.PAYLOAD_ID]) payload = payloadMap[payload.PAYLOAD_ID];
    else {
      payload.PAYLOAD_ID ||= String.random();
      payloadMap[payload.PAYLOAD_ID] = payload;
    }

    const parentNode = parentNodeOstateConfig instanceof DecisionNode ? parentNodeOstateConfig : undefined;
    const stateConfig = parentNode ? parentNode.stateConfig() : parentNodeOstateConfig;
    this.parentNode = () => parentNode;
    this.stateConfig = () => stateConfig;
    this.name = stateConfig.name;
    this.states = stateConfig.states;
    this.stateMap = () => stateMap;
    this.isLeaf = stateConfig.isLeaf;
    this.stateNames = stateConfig.stateNames;
    this.getByPath = (...idPath) => getByPath(this, ...idPath);
    this.getByName = (...namePath) => getByName(this, ...namePath);

    this.setValue = (key, value) => payload[key] = value;

    const metadata = {};
    this.metadata = (attribute, value) => {
        if (attribute === undefined) return Object.merge({}, metadata);
        if (value !== undefined) return metadata[attribute] = value;
        return metadata[attribute];
    }

    this.payload = (noConfig) => {
      if (noConfig) return payload;
      const copy = parentNode ? parentNode.payload() : stateConfig.payload();
      Object.keys(payload).forEach((key) => {
        copy[key] = payload[key];
      });
      copy.node = this;
      return copy;
    };

    let recurseAway = false;
    this.shouldRecurse = (shouldRecurse) => {
      if (shouldRecurse === true) recurseAway = true;
      if ((recurseAway || Object.keys(stateMap).length > 0 || !instance.selfReferencingPath()) === false) {
        console.log('failed?')
      }
      return recurseAway || Object.keys(stateMap).length > 0 || !instance.selfReferencingPath();
    };

    function attach(treeOnode) {
      if (instance.shouldRecurse()) {
        const node = treeOnode instanceof DecisionNode ? treeOnode : treeOnode.root();
        const tree = node.tree();
        const configMap = instance.stateConfig().stateMap();

        const stateKeys = instance.stateNames();
        if (stateKeys[node.name()]) throw new Error(`Attempting to add node whos template alread exists as a child. You must create another node so that it maintains a unique path`);
        const addState = node.tree().addState;
        addState(stateConfig);
        const newNode = node.then(stateConfig.name());

        if (instance.shouldRecurse()) {
          instance.shouldRecurse();
          for(let index = 0; index < stateKeys.length; index += 1) {
            const stateName = stateKeys[index];
            if (!tree.validState(stateName)) {
              addState(configMap[stateName]);
            }
            const childNode = newNode.then(stateName);
            const alreadyPresent = childNode.stateNames().indexOf(childNode.name());
            if (!alreadyPresent) {
              instance.then(childNode).attach(childNode, true);
            }
          }
        }
        return node;
      }
    }

    this.attach = attach

    function createNode(name, payload, doNotCreate) {
      const node = stateMap[name];
      if (node || doNotCreate) return node;
      const tree = instance.tree();
      const stateCreated = !tree.stateConfigs()[name];
      const stateConfig = tree.getState(name, payload);
      instance.stateConfig().then(stateConfig);
      if (stateCreated) payload = {};
      const templateNode = instance.tree().root().breathFirst(n =>
        n.parent().name() === instance.name() && stateConfig.name() === n.name(), true);
      if (tree.referenceNodes())
        return templateNode ? templateNode : new (tree.constructor.Node)(stateConfig, payload, instance);
      if (tree.nodeInheritance())
        return new (tree.constructor.Node)(templateNode || stateConfig, payload, instance);
      return new (tree.constructor.Node)(stateConfig, payload, instance);
    }

    this.then = (name, payload) => {
      if (name instanceof DecisionNode) {
        const attached = name.attach(this);
        this.tree().changed()
        return attached;
      }
      if (Array.isArray(name)) {
        const returnNodes = [];
        for (let index = 0; index < name.length; index += 1) {
          returnNodes.push(this.then(formatName(name[index])));
        }
        return returnNodes;
      }
      name = formatName(name);
      const newState = createNode(name, payload);
      this.tree().changed()
      stateMap[name] = newState;

      return newState;
    }

    const onChange = [];
    const changeEvent = new CustomEvent('change');

    const trigger = () => {
      changeEvent.trigger(this.values());
      this.tree().changed();
    }
    this.onChange = (func) => changeEvent.on(func);
    let changePending = 0;
    const delay = 100;
    this.changed = () => {
      let changeId = ++changePending;
      setTimeout(() => {
        if (changeId === changePending) {
          const values = this.values();
          changeEvent.trigger(values)
        }
      }, delay);
    }

    this.remove = (child) => {
      if (child === undefined) return this.parent().remove(this);
      const state = stateMap[child.name()];
      delete stateMap[child.name()];
      this.stateConfig().remove(child.stateConfig());
      return state;
    }

    this.tree = () => {
      let curr = this;
      while (!(curr instanceof DecisionTree)) curr = curr.parent();
      return curr;
    };
    this.root = () => this.tree().root();
    this.isRoot = () => parent instanceof DecisionTree;

    function addReachableChildren(node, nodes, doNotCreate, searchAll) {
      if (node.shouldRecurse()) {
        const stateKeys = node.stateNames();
        for(let index = 0; index < stateKeys.length; index += 1) {
          const stateName = stateKeys[index];
          if (searchAll || node.reachable(stateName)) {
            const child = node.next(stateName, doNotCreate);
            if (child) nodes.push(child);
          }
        }
      }
    }

    // iff func returns true function stops and returns node;
    this.breathFirst = (func, doNotCreate, searchAll) => {
      const nodes = [this];
      const runFunc = (typeof func) === 'function';
      let nIndex = 0;
      const nodeMap = {};
      while (nodes[nIndex]) {
        let node = nodes[nIndex];
        if (!nodeMap[node.id()]) {
          const val = func(node);
          if (val === true) return node;
          if (val) return val;
          addReachableChildren(node, nodes, doNotCreate, searchAll);
          nodeMap[node.id()] = true;
        }
        nIndex++;
      }
    }

    this.depthFirst = (func, doNotCreate, searchAll) => {
      if (func(instance)) return true;
      if (this.shouldRecurse()) {
        const stateKeys = instance.stateNames();
        for(let index = 0; index < stateKeys.length; index += 1) {
            const child = instance.next(stateKeys[index], doNotCreate);
            if (child && (searchAll || instance.reachable(child.name()))) {
              child.depthFirst(func);
            }
        }
      }
    }

    this.forall = (func) => {
      this.breathFirst(func, true, true);
    }

    function decendent(nameOfunc) {
      return instance.breathFirst(selectorFunc(nameOfunc));
    }
    function findParent(nameOfunc) {
      if (nameOfunc === undefined) return parent;
      const selector = selectorFunc(nameOfunc);
      const curr = instance;
      while(!curr.isRoot()) {
        if (selector(curr)) return curr;
        curr = curr.parent();
      }
    }
    function closest(nameOfunc) {
      const selector = selectorFunc(nameOfunc);
      const nodes = [instance];
      let index = 0;
      while (nodes.length > index) {
        const node = nodes[index];
        if (selector(node)) return node;
        const parent = nodes.parent();
        if (parent.reachable(node.name())) {
          nodes.push(parent);
        }
        addReachableChildren(node, nodes);
      }
    }

    this.find = decendent;
    this.parent = findParent;
    this.closest = closest;

    // Breath First Search
    this.forEach = (func, depthFirst) => {
      if (depthFirst) this.depthFirst(func);
      else this.breathFirst(func);
    }

    this.forPath = (func) => {
      const nodes = [];
      let node = this;
      while (!node.isRoot()) {
        nodes.push(node);
        node = node.parent();
      }
      for (let index = nodes.length - 1; index > -1; index--) {
        const val = func(nodes[index]);
        if (val === true) return nodes[index];
        if (val) return val;
      }
    }

    this.next = (name, doNotCreate) => {
      name = formatName(name);
      if (!stateConfig.validState(name)) throw new Error(`Invalid State: ${name}`);
      if (stateMap[name] === undefined) {
        stateMap[name] = createNode(name, null, doNotCreate);
      }
      return stateMap[name];
    }

    this.forEachChild = (func, doNotCreate) => {
      const stateKeys = this.stateNames();
      for(let index = 0; index < stateKeys.length; index += 1) {
        const childName = stateKeys[index];
        if (this.reachable(childName)) {
          const childNode = this.next(childName, doNotCreate);
          func(childNode);
        }
      }
    }
    this.children = () => {
      const children = [];
      const stateKeys = this.stateNames();
      for(let index = 0; index < stateKeys.length; index += 1) {
        children.push(this.next(stateKeys[index]));
      }
      return children;
    }
    this.list = (filter, map) => {
      const list = [];
      const should = {filter: (typeof filter) === 'function', map: (typeof map) === 'function'};
      this.forEach((node) => {
        if (should.filter ? filter(node) : true) {
          list.push((should.map ? map(node) : node));
        }
      });
      return list;
    };
    this.nodes = () => this.list(null, (node) => node);
    this.leaves = () => this.list((node) => node.isLeaf(), null);
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

    this.values = (values) => {};

    this.conditions = this.stateConfig().conditions;

    this.canReachChild = (name) => {
      if(this.stateNames().indexOf(name) === -1) return false;
      let nodeConds = this.conditions(name);
      if (nodeConds.length === 0) return true;
      for (let index = 0; index < nodeConds.length; index++) {
        if (nodeConds[index].satisfied(this)) {
          return nodeConds[index];
        }
      }
      return false;
    }

    this.reachable = (childName) => {
      if (childName) return this.canReachChild(childName);
      if (this.isRoot())  return true;
      return parent.reachable(this.name()) && parent.reachable();
    }
    this.reachableChildren = () => {
      const list = [];
      const children = this.children();
      for (let index = 0; index < children.length; index++) {
        const child = children[index];
        const condition = this.reachable(child.name());
        if (condition) list.push({condition, child})
      }
      return list;
    }
    this.child = (name) => {
      const children = this.children();
      for (let index = 0; index < children.length; index++) {
        if (children[index].name() === name) return children[index];
      }
    }
    function reached(node, nodeMap, other) {
      do {
        if (!node.parent().reachable(node.name())) break;
        if (nodeMap[node.id()] && nodeMap[other.id()]) return true;
        nodeMap[node.id()] = node;
        node = node.parent();
      } while (node && node instanceof DecisionNode);
    }
    this.reachableFrom = (node) => {
      node ||= this.root();
      const nodeMap = {};
      nodeMap[node.id()] = node;
      return reached(this, nodeMap, other) || reached(node.parent(), nodeMap, other);
    }
    this.path = () => {
      let path = [];
      let curr = this;
      while (!(curr instanceof DecisionTree)) {
        path.push(curr.name());
        curr = curr.parent();
      }
      return path.reverse();
    }
    this.nodeOnlyToJson = () => {
      let pl = Object.toJson(payload);
      const json = {name: this.name(), payload: pl};

      json.children = {};
      json.metadata = Object.toJson(this.metadata());
      if (this.shouldRecurse()) {
        this.children().forEach((child) => {
          if (child.path().length > instance.path().length)
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
      if (this.shouldRecurse()) {
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
      let curr = this.parent();
      while(!(curr instanceof DecisionTree)) {
        if (curr.name() === name) count++;
        curr = curr.parent();
      }
      return count;
    }
    this.selfReferencingPath = () => {
      let names = {};
      let curr = this.parent();
      while(!(curr instanceof DecisionTree)) {
        if (names[curr.name()]) return true;
        names[curr.name()] = true;
        curr = curr.parent();
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
        if (this.reachable(stateName)) {
          const nextState = this.next(stateName);
          if (nextState.parentCount(stateName) < 2) {
            str += nextState.toString(tabs + 1, attr);
          }
        }
      }
      return str;
    }

    this.structure = (tabs, attr) => {
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
          str += nextState.structure(tabs + 1, attr);
        }
      }
      return str;
    }
  }
}


// Properties:
//    referenceNodes: will points to a single instance.
//    nodeInheritance: will inhearate from a node with the same config and parent.
class DecisionTree extends Lookup {
  constructor(name, payload, properties) {
    properties ||= {};
    let stateConfigs = properties.stateConfigs;
    let referenceNodes = properties.referenceNodes === true;
    let nodeInheritance = properties.nodeInheritance === true;
    super();
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
      json.referenceNodes = this.referenceNodes();
      json.root = node.nodeOnlyToJson();
      return json;
    }

    this.referenceNodes = () => referenceNodes;
    this.nodeInheritance = () => nodeInheritance;
    this.nameTaken = (name) => stateConfigs[formatName(name)] !== undefined;

    function change(from, to) {
      const state = stateConfig[from];
      if (!state) throw new Error(`Invalid state name '${to}'`);
      state.name(to);
    }

    function getState(name, payload) {
      const stateConfig = stateConfigs[name];
      if (stateConfig) return stateConfig;
      return (stateConfigs[name] = new StateConfig(name, payload, tree.constructor));
    }

    this.validState = (name) => stateConfigs[name] !== undefined;

    function addState(name, payload) {
      if (name instanceof StateConfig) {
        if (stateConfigs[name.name()] === undefined)
          return (stateConfigs[name.name()] = name);
        if (stateConfigs[name.name()] === name) return name;
        throw new Error(`Attempting to add a new state with name '${name.name()}' which is already defined`);
      }
      return tree.getState(name, payload);
    }

    function addStates(states) {
      if (Array.isArray(states)) {
        states.forEach((state) => tree.addState(state));
      } else if (states instanceof Object){
        Object.keys(states).forEach((name) => tree.addState(name, states[name]));
      }
      throw new Error('states must be and array of StateConfigs or an Object of key => payload mapping');
    }

    this.getByPath = (...idPath) => getByPath(this.root(), ...idPath);
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

    const rootNode = new (this.constructor.Node)(this.getState(name, payload), instPld, this);
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
    if (json.metadata)
      Object.keys(json.metadata).forEach((key) =>
          child.metadata(key, Object.fromJson(json.metadata[key])));
    child.conditions.addAll(Object.fromJson(json[name].conditions));
    addChildren(child, json[name].children);
  }
}

DecisionTree.fromJson = (json) => {
  const constructor = Object.class.get(json._TYPE);
  const stateConfigs = Object.fromJson(json.stateConfigs);
  const properties = {stateConfigs, referenceNodes: json.referenceNodes};
  const tree = new constructor(json.root.name, json.root.payload, properties);
  addChildren(tree.root(), json.root.children);
  return tree;
}

DecisionTree.DecisionNode = DecisionNode;
DecisionTree.Node = DecisionNode;
module.exports = DecisionTree;


// Messaging_App
// set Max characters for you and them
// you cannot text more than Max characters.
// if (incomingMessage.length > Max) autoRespond: Recepiant can only recieve Max chanracters
// if (only allow two messages without achnowledgement)
