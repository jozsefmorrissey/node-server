class Category extends Cost {
  constructor (id, method, cost, length, width, depth) {
    super(id, method, cost, length, width, depth);

    this.calc = (assemblyOrCount) => {
      const cost = 0;
      this.children.forEach((child) => child.calc(assemblyOrCount));
      return cost || -0.01;
    }
    
    this.unitCost = () => undefined;
  }
}

Cost.register(Category);
