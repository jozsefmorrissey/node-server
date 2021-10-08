


const Cost = require('../cost.js');


class ReferenceCost extends Cost {
  constructor(referenceCost) {
    super(referenceCost.props());
    const props = this.props();
    this.children = [];
    referenceCost.children.forEach((child) =>
        this.children.push(new ReferenceCost(child)));

    this.id = referenceCost.id;
    this.calc = referenceCost.calc;
  }
}
module.exports = ReferenceCost
