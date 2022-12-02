
const CustomEvent = require('./custom-event');

class Bundler {
  constructor() {
    this.change = () => {throw Error('change must be implemented');};
    this.write = () => {throw Error('write must be implemented');};

    const onChangeEvent = new CustomEvent('change');
    this.trigger = onChangeEvent.trigger;
    this.onChange = onChangeEvent.on;
  }
}

exports.Bundler = Bundler;
