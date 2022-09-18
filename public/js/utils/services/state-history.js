
class StateHistory {
  constructor(getState, minTimeInterval, states) {
    states ||= [];
    let index = 0;
    minTimeInterval = minTimeInterval || 400;
    const instance = this;
    let lastStateReqTime;


    const indexHash = () => states[index].hash;
    this.toString = () => {
      let str = ''
      states.forEach((s, i) => i === index ?
                        str += `(${s.hash}),` :
                        str += `${s.hash},`);
      return str.substr(0, str.length - 1);
    }

    function getNewState(reqTime) {
      if (reqTime === lastStateReqTime) {
        const currState = getState();
        const currHash = JSON.stringify(currState).hash();
        if (states.length === 0 || currHash !== indexHash()) {
          if (states && states.length - 1 > index) states = states.slice(0, index + 1);
          states.push({hash: currHash, json: currState});
          index = states.length - 1;
          console.log(instance.toString());
        }
      }
    }
    if (states.length === 0) getNewState();

    this.index = (i) => {
      if (i > -1 && i < states.length) index = i;
      return index;
    }

    this.clone = (getState) => {
      const sh = new StateHistory(getState, minTimeInterval, states);
      sh.index(index);
      return sh;
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

    this.canGoBack = () => index > 0;
    this.canGoForward = () => index < states.length - 1;

    this.back = () => {
      if (this.canGoBack()) {
        const state = states[--index];
        lastStateReqTime = 0;
        console.log(this.toString());
        return state.json;
      }
    }

    this.forward = () => {
      if (this.canGoForward()) {
        const state = states[++index];
        lastStateReqTime = 0;
        console.log(this.toString());
        return state.json;
      }
    }
  }
}

module.exports = StateHistory;
