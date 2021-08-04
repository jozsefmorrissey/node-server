
/**
  A branching cost that will incorporate
**/
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

Category.explanation = `A branching cost that will incorporate all child costs 
                        in its total`
Cost.register(Category);
