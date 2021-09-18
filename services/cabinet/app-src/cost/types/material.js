


const Cost = require('../cost.js');
const Assembly = require('../../objects/assembly/assembly.js');

class Material extends Cost {
  constructor (props) {
    super(props);
    props = this.props();
    props.cost = props.cost / (props.count || 1);
    const instance = this;
    this.company = Cost.getterSetter(props, 'company');
    this.formula = Cost.getterSetter(props, 'formula');
    this.partNumber = Cost.getterSetter(props, 'partNumber');
    this.method = Cost.getterSetter(props, 'method');
    this.length = Cost.getterSetter(props, 'length');
    this.width = Cost.getterSetter(props, 'width');
    this.depth = Cost.getterSetter(props, 'depth');
    this.cost = Cost.getterSetter(props, 'cost');


    this.unitCost = (attr) => {
      const unitCost = Material.configure(instance.method(), instance.cost(),
        instance.length(), instance.width(), instance.depth());
      const copy = JSON.parse(JSON.stringify(unitCost));
      if (attr) return copy[attr];
      return copy;
    }

    this.calc = (assemblyOrCount) => {
      const unitCost = this.unitCost();
      const formula = this.formula() || unitCost.formula;
      if (assemblyOrCount instanceof Assembly)
        return Cost.evaluator.eval(`${unitCost.value}*${formula}`, assemblyOrCount);
      else if (Number.isFinite(assemblyOrCount))
        return Cost.evaluator.eval(`${unitCost.value}*${assemblyOrCount}`);
      else
        throw new Error('calc argument must be a number or Assembly');
    }
  }
}

Material.instanceProps = ['formula'];
Material.staticProps = ['method', 'cost', 'length', 'width',
                          'depth', 'company', 'partNumber'];

Material.methods = {
  LINEAR_FEET: 'Linear Feet',
  SQUARE_FEET: 'Square Feet',
  CUBIC_FEET: 'Cubic Feet',
  UNIT: 'Unit'
};

Material.methodList = Object.values(Material.methods);


Material.configure = (method, cost, length, width, depth) => {
  const unitCost = {};
  switch (method) {
    case Material.methods.LINEAR_FEET:
      const perLinearInch = Cost.evaluator.eval(`${cost}/${length}`);
      unitCost.name = 'Linear Inch';
      unitCost.value = perLinearInch;
      unitCost.formula = 'l';
      return unitCost;
    case Material.methods.SQUARE_FEET:
      const perSquareInch = Cost.evaluator.eval(`${cost}/(${length}*${width})`);
      unitCost.name = 'Square Inch';
      unitCost.value = perSquareInch;
      unitCost.formula = 'l*w';
      return unitCost;
    case Material.methods.CUBIC_FEET:
      const perCubicInch = Cost.evaluator.eval(`${cost}/(${length}*${width}*${depth})`);
      unitCost.name = 'Cubic Inch';
      unitCost.value = perCubicInch;
      unitCost.formula = 'l*w*d';
      return unitCost;
    case Material.methods.UNIT:
      unitCost.name = 'Unit';
      unitCost.value = cost;
      return unitCost;
    default:
      throw new Error('wtf');
      unitCost.name = 'Unknown';
      unitCost = -0.01;
      formula = -0.01;
      return unitCost;
  }
};

Material.explanation = `Cost to be calculated by number of units or demensions`;

module.exports = Material
