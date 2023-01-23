
class NoActivityRunner {
  constructor(timelapse, noActivityFunc) {
    let pending = false;
    let callCount = 0;

    const secondCallback = (callId) => () => {
      if (callId === callCount) noActivityFunc();
    }
    const firstCallback = () => {
      pending = false;
      setTimeout(secondCallback(callCount), timelapse);
    }

    return () => {
      callCount++;
      if (!pending) {
        setTimeout(firstCallback, timelapse);
      }
    }
  }
}

module.exports = NoActivityRunner;
