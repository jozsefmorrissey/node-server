class Labor extends Material {
  constructor (props) {
    super(props);
    const type = props.laborType;
    this.type = () => type;
    this.hourlyRate = () => Labor.hourlyRates[type];
    const parentCalc = this.calc;
    this.calc = (assembly) => parentCalc(assembly) * Labor.hourlyRates[type];
    if (Labor.hourlyRates[type] === undefined) Labor.types.push(type);
    Labor.hourlyRate(type, props.hourlyRate || Labor.defaultRate);

    const parentToJson = this.toJson;
  }
}

Labor.requiredProps = Material.requiredProps.concat(['type', 'hourlyRate']);
Labor.defaultRate = 40;
Labor.hourlyRate = (type, rate) => {
  rate = Cost.evaluator.eval(new String(rate));
  if (!Number.isNaN(rate)) Labor.hourlyRates[type] = rate;
  return Labor.hourlyRates[type] || Labor.defaultRate;
}
Labor.hourlyRates = {};
Labor.types = [];
Labor.explanation = `Cost to be calculated hourly`;

Cost.register(Labor);
