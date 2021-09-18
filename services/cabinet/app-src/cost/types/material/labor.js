


const Material = require('../material.js');
const Cost = require('../../cost.js');


// unitCost.value = (hourlyRate*hours)/length
// calc(assembly) = unitCost.value * formula

class Labor extends Material {
  constructor (props) {
    super(props);
    props = this.props();
    const type = props.laborType;
    this.type = () => type;
    this.hourlyRate = () => Labor.hourlyRates[type];
    const parentCalc = this.calc;
    this.cost = () => this.hourlyRate() * props.hours;
    if (Labor.hourlyRates[type] === undefined) Labor.types.push(type);
    Labor.hourlyRate(type, props.hourlyRate);

    const parentToJson = this.toJson;
  }
}


Labor.instanceProps = Material.instanceProps.concat(['type', 'hourlyRate']);
Labor.staticProps = Material.staticProps.concat(['type', 'hourlyRate']);
Labor.defaultRate = 40;
Labor.hourlyRate = (type, rate) => {
  rate = Cost.evaluator.eval(new String(rate));
  if (!Number.isNaN(rate)) Labor.hourlyRates[type] = rate;
  return Labor.hourlyRates[type] || Labor.defaultRate;
}
Labor.hourlyRates = {};
Labor.types = [];
Labor.explanation = `Cost to be calculated hourly`;

module.exports = Labor
