

const Lookup = require('./object/lookup')
const CustomEvent = require('./custom-event')
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
  constructor(name, payload) {
    super();
    name = formatName(name)
    Object.getSet(this, {name, payload});
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
  return new StateConfig(json.name, payload);
}
const defaultResolver = (node) => node.name();
class DecisionCondition {
  constructor(condition, details, resolveValue) {
    Object.getSet(this, {condition, details, _IMMUTABLE: true});
    this.resolveValue = (typeof resolveValue) === 'function' ? resolveValue :
            defaultResolver;
  }
}

class DecisionEqualCondition extends DecisionCondition {
  constructor(condition, details, resolveValue) {
    super(condition, details, resolveValue);
    this.satisfied = (node) => Object.equals(this.resolveValue(node, this.details()), condition);
  }
}

class DecisionFunctionCondition extends DecisionCondition {
  constructor(func, details, resolveValue) {
    if ((typeof func) !== 'function') throw new Error('arg 2 is not of type function');
    super(func, details, resolveValue);
    this.satisfied = (node) => func(this.resolveValue(node, this.details()));
  }
}

class DecisionRegexCondition extends DecisionCondition {
  constructor(regex, details, resolveValue) {
    super(regex, details, resolveValue);
    this.satisfied = (node) => {
      const val = this.resolveValue(node, this.details());
      return val.match(regex);
    }
  }
}

DecisionCondition.getter = (resolveValue) => (condition, details) => {
  let cxtr = DecisionEqualCondition;
  if ((typeof condition) === 'function') cxtr = DecisionFunctionCondition;
  if (condition instanceof RegExp) cxtr = DecisionRegexCondition;
  return new cxtr(condition, details, resolveValue);
}

// class DecisionConditionList {
//   constructor() {
//     const list = [];
//     this.push = (dc) => {
//       if (dc instanceof DecisionCondition) list.push(dc);
//     }
//     this.list = () => [].copy(list);
//     this.at = (index) => list[index];
//   }
// }
//
// DecisionConditionList.fromObject = (obj, getter) => {
//   getter ||= DecisionCondition.getter();
//   const list = new DecisionConditionList();
//
// }

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
      const copy = stateConfig.payload();
      Object.keys(payload).forEach((key) => {
        copy[key] = payload[key];
      });
      copy.node = this;
      return copy;
    };

    const shouldRecurse = () => Object.keys(stateMap) > 0 || !instance.selfReferencingPath();
    this.shouldRecurse = shouldRecurse;

    function attach(treeOnode) {
      if (shouldRecurse()) {
        const node = treeOnode instanceof DecisionNode ? treeOnode : treeOnode.root();

        const stateKeys = instance.stateNames();
        if (stateKeys[node.name()]) throw new Error(`Attempting to add node whos template alread exists as a child. You must create another node so that it maintains a unique path`);
        const nodeConfig = node.stateConfig();
        tree.addState(nodeConfig);

        if (shouldRecurse()) {
          shouldRecurse();
          for(let index = 0; index < stateKeys.length; index += 1) {
            const childNode = node.next(stateKeys[index]);
            const alreadyPresent = childNode.stateNames().indexOf(childNode.name());
            if (! alreadyPresent && !childNode.selfReferencingPath()) {
              instance.then(childNode).attach(childNode, true);
            }
          }
        }
        return node;
      }
    }

    this.attach = attach

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
      if (name instanceof DecisionNode) {
        const attached = attach(name);
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

    function addReachableChildren(node, nodes) {
      if (node.shouldRecurse()) {
        const stateKeys = node.stateNames();
        for(let index = 0; index < stateKeys.length; index += 1) {
          const stateName = stateKeys[index];
          if (node.reachable(stateName)) {
            const child = node.next(stateName);
            if (child && node.reachable(child.name())) {
              nodes.push(child);
            }
          }
        }
      }
    }

    // iff func returns true function stops and returns node;
    this.breathFirst = (func) => {
      const nodes = [this];
      const runFunc = (typeof func) === 'function';
      let nIndex = 0;
      while (nodes[nIndex]) {
        let node = nodes[nIndex];
        if (node.reachable()) {
          const val = func(node);
          if (val === true) return node;
          if (val) return val;
          addReachableChildren(node, nodes);
        }
        nIndex++;
      }
    }

    this.depthFirst = (func) => {
      if (instance.reachable()) {
        if (func(instance)) return true;
        if (shouldRecurse()) {
          const stateKeys = instance.stateNames();
          for(let index = 0; index < stateKeys.length; index += 1) {
              const child = instance.next(stateKeys[index]);
              if (instance.reachable(child.name())) {
                child.depthFirst(func);
              }
          }
        }
      }
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
        if (parent.reachable() && parent.reachable(node.name())) {
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

    this.next = (name) => {
      name = formatName(name);
      if (!stateConfig.validState(name)) throw new Error(`Invalid State: ${name}`);
      if (stateMap[name] === undefined) {
        stateMap[name] = createNode(name, null);
      }
      return stateMap[name];
    }

    this.forEachChild = (func) => {
      const stateKeys = this.stateNames();
      for(let index = 0; index < stateKeys.length; index += 1) {
        const childNode = this.next(stateKeys[index]);
        if (childNode.shouldRecurse()) {
          func(childNode);
        }
      }
    }
    this.children = () => {
      const children = [];
      this.forEachChild((child) => children.push(child));
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

    const conditions = [];
    const childConditions = {};
    this.conditions = () => [].copy(conditions);

    this.conditions.add = (condition, details) => {
      let dc = condition instanceof DecisionCondition ? condition :
                this.tree().constructor.getCondition(condition, details);
      conditions.push(dc);
    }
    this.conditions.addAll = (conds) => {
      for (let index = 0; index < conds.length; index++) {
        const cond = conds[index];
        if (!(cond instanceof DecisionCondition)) throw new Error('WTF(sorry its been a long week): this needs to be a DecisionCondition');
        conditions.push(cond);
      }
    }
    this.conditions.remove = (cond) => conditions.remove(cond);

    this.conditions.child = (name) => {
      let copy = [];
      if (name !== undefined && childConditions[name]) {
        copy.concatInPlace(childConditions[name]);
      }
      if (childConditions[undefined]) copy.concatInPlace(childConditions[undefined]);
      return copy;
    }
    this.conditions.child.add = (condition, details, targetNodeName) => {
      let dc = this.tree().constructor.getCondition(condition, details);
      if (!childConditions[targetNodeName]) childConditions[targetNodeName] = [];
      childConditions[targetNodeName].push(dc);
    }
    this.conditions.child.addAll = (conds) => {
      const keys = Object.keys(conds);
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const condList = conds[key];
        for (let index = 0; index < condList.length; index++) {
          const cond = condList[index];
          if (!(cond instanceof DecisionCondition)) throw new Error('WTF(sorry its been a long week): this needs to be a DecisionCondition');
          if (!childConditions[key]) childConditions[key] = [];
          childConditions[key].push(cond);
        }
      }
    }
    this.conditions.child.remove = (cond) => {
      if (!(cond instanceof DecisionCondition)) return;
      if (!childConditions[cond.name()]) return;
      return childConditions[cond.name()].remove(cond);
    }

    this.canReachChild = (name) => {
      if(this.stateNames().indexOf(name) === -1) return false;
      let nodeConds = this.conditions.child(name);
      if (nodeConds.length === 0) return true;
      for (let index = 0; index < nodeConds.length; index++) {
        if (nodeConds[index].satisfied(this.child(name))) return true;
      }
      return false;
    }

    this.canReach = () => {
      if (conditions.length === 0) return true;
      for (let index = 0; index < conditions.length; index++) {
        if (conditions[index].satisfied(this)) return true;
      }
      return false;
    }

    this.reachable = (childName) => {
      if (this.isRoot()) return true;
      if (childName !== undefined) return this.canReachChild(childName);
      else  return this.canReach();
    }
    this.child = (name) => {
      const children = this.children();
      for (let index = 0; index < children.length; index++) {
        if (children[index].name() === name) return children[index];
      }
    }
    function reached(node, nodeMap, other) {
      let reachable;
      do {
        reachable = node.reachable();
        if (reachable) {
          if (node.parent().reachable(node.name())) break;
          if (nodeMap[node.id()] && nodeMap[other.id()]) return true;
          nodeMap[node.id()] = node;
          node = node.parent();
        }
      } while (reachable && node && node instanceof DecisionNode);
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
      const conds = Array.toJson(conditions);
      const childConds = Object.toJson(Object.values(childConditions));
      const json = {name: this.name(), payload: pl, conditions: conds,
                    childConditions: childConds};

      json.children = {};
      json.metadata = Object.toJson(this.metadata());
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
      if (this.reachable()) {
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
      return '';
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


class DecisionTree extends Lookup {
  constructor(name, payload, stateConfigs) {
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
    child.conditions.child.addAll(Object.fromJson(json[name].childConditions));
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
DecisionTree.Condition = DecisionCondition;
DecisionTree.getCondition = DecisionCondition.getter();
module.exports = DecisionTree;


// Messaging_App
// set Max characters for you and them
// you cannot text more than Max characters.
// if (incomingMessage.length > Max) autoRespond: Recepiant can only recieve Max chanracters
// if (only allow two messages without achnowledgement)
