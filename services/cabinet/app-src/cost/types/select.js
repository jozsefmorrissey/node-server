


const Cost = require('../cost.js');

class SelectCost extends Cost {
  constructor (props) {
    super(props);
    props = this.props();
    Object.getSet(this, props, 'modifyDemension', 'default');

    const selected = 0;
    this.selected = (index) => {
      if (index !== undefined)
        this.selected(index);
      return this.children[this.selected()];
    }

    this.selectedId = () => {
      const child = this.selected();
      return child === undefined ? '' : child.id();
    }

    this.calc = (assemblyOrCount) => this.children[selected] ?
        this.children[selected].calc(assemblyOrCount) : -0.01;

    this.unitCost = () => this.children[selected] ?
        this.children[selected].unitCost() : -0.01;

    const selectedId = this.selectedId();
    if (selectedId) {
      this.children.forEach((child, index) => {
        if (child.id() === selectedId) selected = index;
      });
    }
  }
}


module.exports = SelectCost