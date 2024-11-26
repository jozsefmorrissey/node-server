
const LayoutAssembly = require('../../layout');

class Crown extends LayoutAssembly {
  constructor(group, partname) {
    super('crw', partname);
    this.group(group);
    this.included = () => this.height() > .1 && this.width() > .1;
    this.height = (value) => {
      return this.propertyConfig('crh',  value);
    }
    this.width = (value) => {
      return this.propertyConfig('crw',  value);
    }

    this.applyTo = (assembly) => {
      if (!this.included()) return false;
      const ceilh = group.room().layout().ceilingHeight();
      const maxY = assembly.position().limits().y;
      return ceilh < maxY - this.height();
    }
  }
}

module.exports = Crown;
