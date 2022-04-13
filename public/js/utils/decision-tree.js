

const Lookup = require('./object/lookup')
const REMOVAL_PASSWORD = String.random();

// terminology
// name - String to define state;
// payload - data returned for a given state
//             - @_UNIQUE_NAME_GROUP - An Identifier used to insure all nodes of multople trees have a unique name.
//                          note: only applicable on root node. governs entire tree
// stateObject - object defining states {name: [payload]...}
// states - array of availible state names.
// node - {name, states, payload, then, addState, addStates};
// then(name) - a function to set a following state.
// next(name) - a function to get the next state.
// back() - a function to move back up the tree.
// top() - a function to get root;
// subtree(conditions, parent) - returns a subtree.
//    @conditions - object identifying conditions for each name or _DEFAULT for undefined
//    @parent - can be used to atach a copy to another branch or tree
// returns all functions return current node;
class DecisionNode extends Lookup{
  constructor(tree, name, instancePayload, parent) {
    super(instancePayload && instancePayload._nodeId ?
              instancePayload._nodeId : String.random(7), 'nodeId');
    Object.getSet(this, 'name');
    const stateMap = {};
    let jump;
    let isComplete = false; // null : requires evaluation
    instancePayload = instancePayload || {};
    const formatId = (nodeId) =>
      nodeId.replace(/^decision-node-(.*)$/, '$1') || nodeId;
    const instance = this;
    instancePayload._nodeId = this.nodeId();
    tree.nodeMap[this.nodeId()]
    // tree.nodeMap[instancePayload._nodeId] = this;
    this.isTree = (t) => t === tree;
    this.setValue = (key, value) => instancePayload[key] = value;
    this.getByName = (n) => tree.stateTemplates[n];
    this.tree = () => tree;
    this.getNode = (nodeOid) => nodeOid instanceof DecisionNode ? nodeOid : tree.idMap[formatId(nodeOid)];
    this.name = name.toString();
    this.states = () => Object.values(stateMap);
    this.instancePayload = () => instancePayload;
    this.set = (key, value) => instancePayload[key] = value;
    this.fromJson = undefined;
    this.instanceCount = (n) => tree.instanceCount(n || this.name);
    this.lastInstance = () => tree.instanceCount(this.name) === 1;
    this.stateDefined = tree.stateDefined;
    this.payload = () => {
      const copy = JSON.clone(tree.stateConfigs[name]) || {};
      Object.keys(instancePayload).forEach((key) => {
        copy[key] = instancePayload[key];
      });
      return copy;
    };
    this.jump = (name) => {
      if (name) jump = tree.getState(name, parent);
      return jump;
    };
    this.getNodeByPath = tree.getNodeByPath;
    this.isLeaf = () => Object.keys(stateMap).length === 0;
    this.stateNames = () => Object.keys(stateMap);
    this.structureChanged = () => {
      isComplete = null;
      if (parent) parent.structureChanged();
    }
    this.remove = (node, password) => {
      if (node === undefined) {
        tree.remove(this, REMOVAL_PASSWORD);
        tree = undefined;
      } else if (REMOVAL_PASSWORD !== password) {
        throw new Error('Attempting to remove node without going through the proper process find the node object you want to remove and call node.remove()');
      } else {
        let removed = false;
        Object.keys(stateMap).forEach((name) => {
          const realNode = stateMap[name];
          if (realNode === node) {
            delete stateMap[name];
            removed = true;
          }
        });
      }
    }

    this.validState = (name) => name !== undefined && instance.stateNames().indexOf(name.toString()) !== -1;

    function attachTree(t) {
      return t.subtree(null, instance, tree);
    }

    this.then = (name, instancePayload, conditional) => {
      if (name instanceof DecisionNode) return attachTree(name);
      if (Array.isArray(name)) {
        const returnNodes = [];
        for (let index = 0; index < name.length; index += 1) {
          returnNodes.push(this.then(name[index]));
        }
        return returnNodes;
      }
      this.structureChanged();
      const newState = tree.getState(name, this, instancePayload);
      if ((typeof conditional) === 'string') {
        const stateId = `${this.name}:${conditional}`;
        stateMap[stateId] = tree.getState(stateId, this, instancePayload);
        stateMap[stateId].jump(newState);
      } else {
        stateMap[name] = newState;
      }
      if (tree.stateTemplates[name] === undefined)
        tree.stateTemplates[name] = newState;
      return newState === undefined ? undefined : newState.jump() || newState;
    }
    this.addState = (name, payload) => tree.addState(name, payload) && this;
    this.addStates = (sts) => tree.addStates(sts) && this;
    this.next = (name) => {
      const state = stateMap[name];
      return state === undefined ? undefined : state.jump() || state;
    }

    this.nameTaken = tree.nameTaken;

    this.back = () => parent;
    this.top = () => tree.rootNode;
    this.isRoot = () => !(parent instanceof DecisionNode)

    this.getRoot = () => {
      const root = this;
      while (!root.isRoot()) root = root.back();
      return root;
    }

    this.copy = (t) => new DecisionNode(t || tree, this.name, instancePayload);

    // Breath First Search
    this.forEach = (func) => {
      const stateKeys = Object.keys(stateMap);
      func(this);
      for(let index = 0; index < stateKeys.length; index += 1) {
        const state = stateMap[stateKeys[index]];
        state.forEach(func);
      }
    }

    this.forEachChild = (func) => {
      const stateKeys = Object.keys(stateMap);
      for(let index = 0; index < stateKeys.length; index += 1) {
        const state = stateMap[stateKeys[index]];
        func(state);
      }
    }
    this.children = () => {
      const children = [];
      this.forEachChild((child) => children.push(child));
      return children;
    }

    this.map = (func) => {
      const ids = [];
      this.forEach((node) => ids.push(func(node)));
      return ids;
    }

    this.nodes = () => {
      return this.map((node) => node);
    }

    this.leaves = () => {
      const leaves = [];
      this.forEach((node) => {
        if (node.isLeaf()) leaves.push(node);
      });
      return leaves;
    }

    this.addChildren = (nodeId) => {
      const orig = this.getNode(nodeId);
      const states = orig.states();
      states.forEach((state) => this.then(state));
      return this;
    }

    this.stealChildren = (nodeOid) => {
      return this.getNode(nodeOid).addChildren(this);
    }

    this.conditionsSatisfied = tree.conditionsSatisfied;

    this.change = (name) => {
      const newNode = this.back().then(name);
      const root = this.top();
      newNode.stealChildren(this);
      this.remove();
    }

    this.subtree = (conditions, parent, t) => {
      if (parent && !parent.conditionsSatisfied(conditions, this)) return undefined
      conditions = conditions instanceof Object ? conditions : {};
      const stateKeys = Object.keys(stateMap);
      let copy;
      if (parent === undefined) copy = this.copy(t);
      else {
        const target = t === undefined ? parent : t;
        const nameTaken = target.nameTaken(this.name);
        try {
          if (!nameTaken) target.addState(this.name, tree.stateConfigs[this.name] || {});
        } catch (e) {
          target.nameTaken(this.name);
          throw e;
        }
        copy = parent.then(this.name, instancePayload);
      }

      for(let index = 0; index < stateKeys.length; index += 1) {
        const state = stateMap[stateKeys[index]];
        state.subtree(conditions, copy, t);
      }
      return copy;
    }

    this.nodeOnlyToJson = (noStates) => {
      const json = {nodeId: this.nodeId(), name, states: [],
                    payload: Object.fromJson(instancePayload)};
      if (noStates !== true) {
        this.states().forEach((state) =>
          json.states.push(state.nodeOnlyToJson()));
      }
      return json;
    }
    this.toJson = (noStates) => {
      const json = tree.toJson(this, noStates);
      json.name = this.name;
      json.payload = Object.fromJson(instancePayload);
      json.nodes = this.nodeOnlyToJson(noStates);
      return json;
    }

    this.declairedName = tree.declairedName;
    this.toString = (tabs, attr) => {
      tabs = tabs || 0;
      const tab = new Array(tabs).fill('  ').join('');
      let str = `${tab}${this.name}`;
      str += attr ? `) ${this.payload()[attr]}\n` : '\n';
      const stateKeys = Object.keys(stateMap);
      for(let index = 0; index < stateKeys.length; index += 1) {
        str += stateMap[stateKeys[index]].toString(tabs + 1, attr);
      }
      return str;
    }
    this.attachTree = attachTree;
    this.treeToJson = tree.toJson;
    this.conditionsSatisfied = tree.conditionsSatisfied;
  }
}
DecisionNode.DO_NOT_CLONE = true;
DecisionNode.stateMap = {};


class DecisionTree {
  constructor(name, payload) {
    let json;
    if (name._TYPE === 'DecisionTree') {
      json = name;
      payload = json.payload;
      name = json.name;
    }
    const names = {};
    name = name || String.random();
    payload = payload || {};
    const stateConfigs = {};
    const idMap = {};
    this.idMap = idMap;
    const nodeMap = {};
    Object.getSet(this, {name, stateConfigs, payload});
    const tree = this;
    tree.stateTemplates = {};

    this.nameTaken = (n) => Object.keys(tree.stateConfigs).indexOf(n) !== -1;

    function addState(name, payload) {
      if (tree.declairedName(name)) {
        throw new Error('Name already declared: This requires unique naming possibly relitive to other trees use DecisionTree.undeclairedName(name) to validate names')
      }
      tree.declareName(name);
      return stateConfigs[name] = payload;
    }

    function stateDefined(name) {
      const exists = false;
      tree.rootNode.forEach((node) =>
        exists = exists || node.name === name);
      return exists;
    }

    function instanceCount(name) {
      let count = 0;
      tree.rootNode.forEach((node) =>
        count += node.name === name ? 1 : 0);
      return count;
    }

    function remove(node, password) {
      if (!node.isTree(tree)) throw new Error('Node has already been removed');
      let removeList = [node];
      let index = 0;
      let currNode;
      while (currNode = removeList[index]) {
          currNode.back().remove(currNode, password);
          removeList = removeList.concat(currNode.states());
          index += 1;
      }
      names[node.name] = undefined;
    }

    function addStates(sts) {
      if ((typeof sts) !== 'object') throw new Error('Argument must be an object\nFormat: {[name]: payload...}');
      const keys = Object.keys(sts);
      keys.forEach((key) => addState(key, sts[key]));
    }

    function getState(name, parent, instancePayload) {
      const node = new DecisionNode(tree, name, instancePayload, parent);
      idMap[node.nodeId()] = node;
      return node;
    }

    const toJson = this.toJson;
    this.toJson = (node, noStates) => {
      node = node || this.rootNode;
      const json = {stateConfigs: {}, _TYPE: this.constructor.name};
      if (noStates) {
        json.stateConfigs[name] = stateConfigs[node.name];
      } else {
        const names = Array.isArray(node) ? node : node.map((n) => n.name);
        names.forEach((name) => {
          const s = stateConfigs[name];
          json.stateConfigs[name] = s && s.toJson ? s.toJson() : s;
        });
      }

      return json;
    }

    function conditionsSatisfied(conditions, state) {
      const parent = state.back()
      if (parent === null) return true;
      conditions = conditions || {};
      const cond = conditions[state.name] === undefined ?
                    conditions._DEFAULT : conditions[state.name];
      const func = (typeof cond) === 'function' ? cond : null;
      if (func && !func(state)) {
        return false;
      }
      return parentConditionsSatisfied(conditions, state);
    }

    function parentConditionsSatisfied(conditions, state) {
      if ((typeof state.back) !== 'function') {
        console.log('here')
      }
      const parent = state.back();
      if (parent === null) return true;
      conditions = conditions || {};
      const cond = conditions[parent.name] === undefined ?
                    conditions._DEFAULT : conditions[parent.name];
      const noRestrictions = cond === undefined;
      const regex = cond instanceof RegExp ? cond : null;
      const target = (typeof cond) === 'string' ? cond : null;
      const func = (typeof cond) === 'function' ? cond : null;
      if (noRestrictions || (regex && state.name.match(regex)) ||
              (target !== null && state.name === target) ||
              (func && func(state))) {
        return parentConditionsSatisfied(conditions, parent);
      }
      return false;
    }

    function getNodeByPath(...path) {
      let currNode = tree.rootNode;
      path.forEach((name) => currNode = currNode.next(name));
      return currNode;
    }

    this.remove = remove;
    this.getNodeByPath = getNodeByPath;
    this.conditionsSatisfied = conditionsSatisfied;
    this.getState = getState;
    this.addState = addState;
    this.addStates = addStates;
    this.nodeMap = nodeMap;
    this.instanceCount = instanceCount;
    this.stateConfigs = stateConfigs;

    this.rootNode = new DecisionNode(tree, name, payload, null);
    idMap[this.rootNode.nodeId()] = this.rootNode;
    payload._nodeId = this.rootNode.nodeId();
    tree.declareName = (name) => names[name] = true;
    tree.declairedName = (name) => !!names[name];

    if (json !== undefined) {
      addStates(Object.fromJson(json.stateConfigs));
      let index = 0;
      let jsons = [json.nodes];
      let currJson;
      nodeMap[jsons[index].name] = this.rootNode;
      while (currJson = jsons[index]) {
        currJson.states.forEach((state) => {
          jsons.push(state);
          state.instancePayload = state.instancePayload || {};
          state.instancePayload._nodeId = state.nodeId;
          nodeMap[state.name] = nodeMap[currJson.name].then(state.name, state.instancePayload);
        });
        index++;
      }
    }

    return this.rootNode;
  }
}

DecisionTree.DecisionNode = DecisionNode;
module.exports = DecisionTree;
