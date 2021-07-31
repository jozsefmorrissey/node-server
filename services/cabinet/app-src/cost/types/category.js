class Category extends Cost {
  constructor (props) {
    super(props);

    this.calc = (assemblyOrCount) => {
      const cost = 0;
      this.children.forEach((child) => child.calc(assemblyOrCount));
      return cost || -0.01;
    }

    this.unitCost = () => undefined;
  }
}

Cost.register(Category);
