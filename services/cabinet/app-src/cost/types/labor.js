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

Cost.register(Labor);


// new Labor('Panel', '1+(0.05*l*w');
// new Labor('Frame', '0.25');
// new Labor('GlueFrame', '0.25');
// new Labor('SandFrame', '0.05*l*l*w*w*d*d');
// new Labor('SandPanel', '(0.25*l*w)/12');
// new Labor('GlueMiter', '(0.25*l*l*w*w)');
// new Labor('InstallBlumotionGuides', '2');
// new Labor('InstallOtherGuides', '2');
// new Labor('InstallFushHinges', '2');
// new Labor('installOverLayHinges', '2');
// new Labor('Paint', '(l*l*w*w*.1)/12');
// new Labor('Stain', '(l*l*w*w*.25)/12');
// new Labor('InstallDrawerFront', '2');
// new Labor('InstallHandleout', 10);
