
class StateHistory {
  constructor(getState, minTimeInterval) {
    let index = 0;
    let states = [];
    minTimeInterval = minTimeInterval || 400;
    let lastStateReqTime;

    const indexHash = () => index > 0 && states[index - 1].hash;

    function getNewState(reqTime) {
      if (reqTime === lastStateReqTime) {
        const currState = getState();
        const currHash = JSON.stringify(currState).hash();
        if (currHash !== indexHash()) {
          if (states.length > index) states = states.slice(0, index);
          states.push({hash: currHash, json: currState});
          index = states.length;
          // console.log('new history element!', index, currHash);
          // console.log(JSON.stringify(currState, null, 2));
        }
      }
    }

    this.newState = () => {
      const thisReqTime = new Date().getTime();
      lastStateReqTime = thisReqTime;
      setTimeout(() => getNewState(thisReqTime), minTimeInterval);
    }

    this.forceState = () => {
      lastStateReqTime = 0;
      getNewState(0);
    }

    this.canGoBack = () => index > 1;
    this.canGoForward = () => index < states.length;

    this.back = () => {
      if (this.canGoBack()) {
        const state = states[--index - 1];
        console.log('goingBack', index, indexHash());
        lastStateReqTime = 0;
        return state.json;
      }
    }

    this.forward = () => {
      if (this.canGoForward()) {
        const state = states[index++];
        console.log('goingForward', index, indexHash());
        lastStateReqTime = 0;
        return state.json;
      }
    }
  }
}

module.exports = StateHistory;
