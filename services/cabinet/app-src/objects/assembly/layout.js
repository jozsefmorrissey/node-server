
const Assembly = require('./assembly');

class LayoutAssembly extends Assembly {
  constructor(group, partCode, partname) {
    super(partCode, partname);
    this.group(group);
  }
}
LayoutAssembly.property('layoutPart', true, false, false, false);


module.exports = LayoutAssembly;
