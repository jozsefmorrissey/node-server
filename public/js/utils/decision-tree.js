




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
class DecisionTree {
  constructor(name, payload) {
    name = name || 'root';
    const stateConfigs = {};
    const nodeMap = {};
    const uniqueGroup = payload._UNIQUE_NAME_GROUP;
    const tree = this;

    function addState(name, payload) {
      if (uniqueGroup && !tree.undeclairedName(name)) {
        throw new Error('Name already declared: This requires unique naming possibly relitive to other trees use DecisionTree.undeclairedName(name) to validate names')
      }
      return stateConfigs[name] = payload;
    }

    function addStates(sts) {
      if ((typeof sts) !== 'object') throw new Error('Argument must be an object\nFormat: {[name]: payload...}');
      const keys = Object.keys(sts);
      keys.forEach((key) => stateConfigs[key] = sts[key]);
    }

    function getState(name, parent) {
      return new DecisionNode(name, stateConfigs[name], parent);
    }

    function conditionsSatisfy(conditions, state) {
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
        return conditionsSatisfy(conditions, parent);
      }
      return false;
    }


    class DecisionNode {
      constructor(name, payload, parent) {
        const states = {};
        let jump;
        let isComplete = false; // null : requires evaluation
        payload = payload || {};
        const instance = this;
        this.nodeId = String.random(7);
        payload._nodeId = `decision-node-${this.nodeId}`;
        nodeMap[payload._nodeId] = this;
        this.getNode = (nodeId) => nodeMap[nodeId];
        this.name = name.toString();
        this.states = states;
        this.payload = payload;
        this.jump = (name) => {
          if (name) jump = getState(name, parent);
          return jump;
        };
        this.isLeaf = () => Object.keys(states).length === 0;
        this.stateNames = () => Object.keys(states);
        this.structureChanged = () => {
          isComplete = null;
          if (parent) parent.structureChanged();
        }
        this.validState = (name) => name !== undefined && instance.stateNames().indexOf(name.toString()) !== -1;

        function attachTree(tree) {
          tree.subtree(null, instance);
        }
        this.then = (name, payload, conditional) => {
          if (name instanceof DecisionNode) return attachTree(name);
          if (Array.isArray(name)) {
            const returnNodes = [];
            for (let index = 0; index < name.length; index += 1) {
              returnNodes.push(this.then(name[index]));
            }
            return returnNodes;
          }
          this.structureChanged();
          payload = payload ? addState(name, payload) : stateConfigs[name];
          const newState = getState(name, this);
          if ((typeof conditional) === 'string') {
            const stateId = `${this.name}:${conditional}`;
            states[stateId] = getState(stateId, this);
            states[stateId].jump(newState);
          } else {
            states[name] = newState;
          }
          return newState === undefined ? undefined : newState.jump() || newState;
        }
        this.addState = (name, payload) => addState(name, payload) && this;
        this.addStates = (sts) => addStates(sts) && this;
        this.next = (name) => {
          const state = states[name];
          return state === undefined ? undefined : state.jump() || state;
        }

        this.nameTaken = (n) => {
          Object.keys(stateConfigs).indexOf(n) !== -1;
        }

        this.routePayloads = () => {
          let currNode = this;
          const payloads = [];
          while(currNode !== null) {
            payloads.push(currNode.payload);
            currNode = currNode.back();
          }
          return payloads.reverse();
        }

        this.back = () => parent;
        this.top = () => rootNode;
        this.isRoot = () => !(parent instanceof DecisionNode)

        this.getRoot = () => {
          const root = this;
          while (!root.isRoot()) root = root.back();
          return root;
        }

        this.isComplete = () => {
          if (isComplete !== null) return isComplete;
          const childRequiredNodes = this.requiredNodes();
          if (childRequiredNodes.length === 0) return true;
          isComplete = true;
          for (let index = 0; isComplete && index < this.states.length; index += 1) {
            const state = states[index];
            isComplete = state.isComplete(childRequiredNodes);
          }
          return isComplete;
        }
        this.copy = () => new DecisionNode(this.name, payload);

        // Breath First Search
        this.forEach = (func) => {
          const stateKeys = Object.keys(states);
          func(this);
          for(let index = 0; index < stateKeys.length; index += 1) {
            const state = states[stateKeys[index]];
            state.forEach(func);
          }
        }

        this.leaves = () => {
          const leaves = [];
          this.forEach((node) => {
            if (node.isLeaf()) leaves.push(node);
          });
          return leaves;
        }

        this.conditionsSatisfy = conditionsSatisfy;

        this.subtree = (conditions, parent) => {
          if (parent && !parent.conditionsSatisfy(conditions, this)) return undefined
          conditions = conditions instanceof Object ? conditions : {};
          const stateKeys = Object.keys(states);
          let copy;
          if (parent === undefined) copy = this.copy();
          else {
            if (parent.nameTaken(this.name)) parent.addState(this.name, payload);
            copy = parent.then(this.name);
          }

          for(let index = 0; index < stateKeys.length; index += 1) {
            const state = states[stateKeys[index]];
            state.subtree(conditions, copy);
          }
          return copy;
        }

        this.undeclairedName = tree.undeclairedName;
        this.toString = (tabs, attr) => {
          tabs = tabs || 0;
          const tab = new Array(tabs).fill('  ').join('');
          let str = `${tab}${this.name}`;
          str += attr ? `) ${payload[attr]}\n` : '\n';
          const stateKeys = Object.keys(states);
          for(let index = 0; index < stateKeys.length; index += 1) {
            str += states[stateKeys[index]].toString(tabs + 1, attr);
          }
          return str;
        }
      }
    }
    DecisionNode.DO_NOT_CLONE = true;

    const rootNode = new DecisionNode(name, payload, null);
    if (uniqueGroup) {
      DecisionTree.registerUniqueNameGroup(uniqueGroup, rootNode);
      tree.undeclairedName = (name) => DecisionTree.undeclairedName(uniqueGroup, name);
    }
    return rootNode;
  }
}

{
  const declarationMap = {};
  DecisionTree.registerUniqueNameGroup = (uniqueGroup, decisionNode) => {
    if(!DecisionTree.undeclairedName(uniqueGroup, decisionNode.name))
      throw new Error(`Name already declared within uniqueGroup "${uniqueGroup}"`)
    if (decisionNode.constructor.name !== 'DecisionNode' ||
            !decisionNode.isRoot()) {
      throw new Error('Can only register the root node of a DecisionTree');
    }
    if (declarationMap[uniqueGroup] === undefined) declarationMap[uniqueGroup] = [];
    declarationMap[uniqueGroup].push(decisionNode);
  }
  DecisionTree.undeclairedName = (uniqueGroup, name) => {
    const list = declarationMap[uniqueGroup] || [];
    let undeclaired = true;
    for (let index = 0; index < list.length; index += 1) {
      const trees = list[index];
      trees.forEach((node) => {
        if (node.name === name) undeclaired = false;
      });
    }
    return undeclaired;
  }
}

module.exports = DecisionTree;
