
class ReferenceCost extends Cost {
  constructor(referenceCost) {
    super(referenceCost.props());
    const props = this.props();
    this.children = [];
    referenceCost.children.forEach((child) => this.children.push(child));

    this.id = referenceCost.id;
    this.calc = referenceCost.calc;

    const reqProps = referenceCost.constructor.staticProps || [];
    reqProps.forEach((prop) => this[prop] = referenceCost.prop);

    const instProps = referenceCost.constructor.instanceProps || [];
    reqProps.forEach((prop) => this[prop] = Cost.getterSetter(props, prop));
  }
}
