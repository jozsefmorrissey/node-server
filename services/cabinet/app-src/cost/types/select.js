class SelectCost extends Cost {
  constructor (props) {
    super(props);
    const selected = 0;
    this.selected = (index) => {
      if (index !== undefined) selected = index;
      return this.children[selected];
    }

    this.selectedId = () => {
      const child = this.selected();
      return child === undefined ? '' : child.id();
    }

    this.calc = (assemblyOrCount) => this.children[selected] ?
        this.children[selected].calc(assemblyOrCount) : -0.01;

    this.unitCost = () => this.children[selected] ?
        this.children[selected].unitCost() : -0.01;
  }
}

Cost.register(SelectCost);
