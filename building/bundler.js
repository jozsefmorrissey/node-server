
class Bundler {
  constructor() {
    this.change = () => {throw Error('change must be implemented');};
    this.write = () => {throw Error('write must be implemented');};
  }
}

exports.Bundler = Bundler;
