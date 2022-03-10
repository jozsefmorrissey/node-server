




// terminology
// name - String to define state;
// payload - data returned for a given state
//             - @_REQUIRED_NODES - An array of names that subsequent nodes must have to complete tree.
//             - @_UNIQUE_NAME_GROUP - An Identifier used to insure all nodes of multople trees have a unique name.
//                          note: only applicable on root node. governs entire tree
// stateObject - object defining states {name: [payload]...}
// states - array of availible state names.
// node - {name, states, payload, then, addState, addStates};
// then(name) - a function to set a following state.
// next(name) - a function to get the next state.
// back() - a function to move back up the tree.
// top() - a function to get root;
//
// returns all functions return current node;
class DecisionTree {
  constructor(name, payload) {
    name = name || 'root';
    payload._REQUIRED_NODES = Array.isArray(payload._REQUIRED_NODES) ?
            payload._REQUIRED_NODES : [];
    const stateConfigs = {};
    const tree = {};
    const nodeMap = {};
    const uniqueGroup = payload._UNIQUE_NAME_GROUP;

    function addState(name, payload) {
      if (uniqueGroup && this.declairedName(name)) {
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


    class DecisionNode {
      constructor(name, payload, parent) {
        const states = {};
        let jump;
        let isComplete = false; // null : requires evaluation
        payload = payload || {};
        payload._nodeId = `decision-node-${String.random(7)}`;
        nodeMap[payload._nodeId] = this;
        this.getNode = (nodeId) => nodeMap[nodeId];
        this.name = name;
        this.states = states;
        this.payload = payload;
        this.jump = (name) => {
          if (name) jump = getState(name, parent);
          return jump;
        };
        this.structureChanged = () => {
          isComplete = null;
          if (parent) parent.structureChanged();
        }
        this.then = (name, payload, conditional) => {
          this.structureChanged();
          payload = payload ? addState(name, payload) : stateConfigs[name];
          const newState = getState(name, payload);
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

        this.requiredNodes = () => {
          const root = this;
          const prevRequirements = parent ? parent.requiredNodes() : [];
          const reqNodes = payload._REQUIRED_NODES.concat(prevRequirements);
          const targetIndex = reqNodes.indexOf(this.name);
          if (targetIndex !== -1) {
            reqNodes = reqNodes.splice(targetIndex, 1)
          }
          return reqNodes;
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
      }
    }
    DecisionNode.DO_NOT_CLONE = true;

    const rootNode = new DecisionNode(name, payload, null);
    if (uniqueGroup) {
      DecisionTree.registerUniqueNameGroup(uniqueGroup, rootNode);
      this.undeclairedName = (name) => DecisionTree.undeclairedName(uniqueGroup, rootNode);
    }
    return rootNode;
  }
}

{
  const declarationMap = {};
  DecisionTree.registerUniqueNameGroup = (uniqueGroup, decisionNode) => {
    if (decisionNode.constructor.name !== 'DecisionNode' ||
            !decisionNode.isRoot()) {
      throw new Error('Can only register the root node of a DecisionTree');
    }
    if (declarationMap[uniqueGroup] === undefined) declarationMap[uniqueGroup] = [];
    declarationMap[uniqueGroup].push(decisionNode);
  }
  DecisionTree.undeclairedName = (uniqueGroup, name) => {
    const list = declarationMap[uniqueGroup] || [];
    for (let index = 0; index < list.length; index += 1) {
      const states = list[index];
      for (let sIndex = 0; sIndex < states.length; sIndex += 1) {
        const node = states[sIndex];
        if (node.name === name) return false;
      }
    }
    return true;
  }
}

module.exports = DecisionTree;
