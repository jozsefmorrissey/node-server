class Labor extends Cost {
  constructor (props) {
    super(props);
    const type = props.laborType;
    const parentCalc = this.calc;
    this.calc = (assembly) => parentCalc(assembly) * Labor.hourlyRates[type];
    if (Labor.hourlyRates[type] === undefined) Labor.types.push(type);
    Labor.hourlyRate(type, props.hourlyRate || Labor.defaultRate);

    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      json.hourlyRate = Labor.hourlyRates[type];
      json.type = type;
      return json;
    }
  }
}

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
