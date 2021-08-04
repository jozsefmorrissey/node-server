
class ReferenceCost extends Cost {
  constructor(referenceCost, props) {
    super(referenceCost.props());
    this.children = [];
    referenceCost.children.forEach((child) => this.children.push(child));

    this.id = referenceCost.id;
    this.partNumber = referenceCost.partNumber;

    this.method = referenceCost.method;
    this.length = referenceCost.length;
    this.width = referenceCost.width;
    this.depth = referenceCost.depth;
    this.cost = referenceCost.cost;

    this.calc = referenceCost.calc;
  }
}
