




// terminology
// name - String to define state;
// payload - data returned for a given state
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
    const stateConfigs = {};
    const tree = {};
    const nodeMap = {};

    function addState(name, payload) {
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
        this.then = (name, payload) => {
          payload = payload ? addState(name, payload) : stateConfigs[name];
          states[name] = (getState(name, this));
          const state = states[name];
          return state === undefined ? undefined : state.jump() || state;
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
      }
    }

    const rootNode = new DecisionNode(name, payload, null);
    return rootNode;
  }
}

module.exports = DecisionTree;




