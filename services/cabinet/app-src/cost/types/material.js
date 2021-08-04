class Material extends Cost {
  constructor (props) {
    super(props);
    props = this.props();
    const instance = this;
    this.company = Cost.getterSetter(props, 'company');
    this.formula = Cost.getterSetter(props, 'formula');
    this.partNumber = Cost.getterSetter(props, 'partNumber');
    this.method = Cost.getterSetter(props, 'method');
    this.length = Cost.getterSetter(props, 'length');
    this.width = Cost.getterSetter(props, 'width');
    this.depth = Cost.getterSetter(props, 'depth');
    this.cost = Cost.getterSetter(props, 'cost');


    this.unitCost = referenceCost ? referenceCost.unitCost : (attr) => {
      const unitCost = Cost.configure(instance.method(), instance.cost(),
        instance.length(), instance.width(), instance.depth());
      const copy = JSON.parse(JSON.stringify(unitCost));
      if (attr) return copy[attr];
      return copy;
    }

    this.calc = (assemblyOrCount) => {
      if (assemblyOrCount instanceof Assembly)
        return Cost.evaluator.eval(`${this.unitCost().value}*${this.formula()}`, assembly);
      else return Cost.evaluator.eval(`${this.unitCost().value}*${assemblyOrCount}`);
    }
  }
}

Material.requiredProps = ['method', 'cost', 'formula', 'length', 'width',
                          'depth', 'company', 'partNumber'];

Material.methods = {
  LINEAR_FEET: 'Linear Feet',
  SQUARE_FEET: 'Square Feet',
  CUBIC_FEET: 'Cubic Feet',
  UNIT: 'Unit'
};

Material.methodList = Object.values(Material.methods);


Material.configure = (method, cost, length, width, depth) => {
  const retValue = {unitCost: {}};
  switch (method) {
    case Material.methods.LINEAR_FEET:
      const perLinearInch = Cost.evaluator.eval(`${cost}/(${length} * 12)`);
      retValue.unitCost.name = 'Linear Inch';
      retValue.unitCost.value = perLinearInch;
      return retValue;
    case Material.methods.SQUARE_FEET:
      const perSquareInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*144)`);
      retValue.unitCost.name = 'Square Inch';
      retValue.unitCost.value = perSquareInch;
      return retValue;
    case Material.methods.CUBIC_FEET:
      const perCubicInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*${depth}*1728)`);
      retValue.unitCost.name = 'Cubic Inch';
      retValue.unitCost.value = perCubicInch;
      return retValue;
    case Material.methods.UNIT:
      retValue.unitCost.name = 'Unit';
      retValue.unitCost.value = cost;
      return retValue;
    default:
      throw new Error('wtf');
      retValue.unitCost.name = 'Unknown';
      retValue.unitCost = -0.01;
      retValue.formula = -0.01;
      return retValue;
  }
};

Material.explanation = `Cost to be calculated by number of units or demensions`;

Cost.register(Material);
