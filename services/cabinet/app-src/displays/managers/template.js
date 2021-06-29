
class TemplateManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const getObject = (values) => mangager.getObject(values);
    this.loadPoint = () => EPNTS.templates.get();
    this.savePoint = () => EPNTS.templates.save();
    this.fromJson = Cost.fromJson;
  }
}

new TemplateManager('template-manager', 'template');

TemplateManager.inputTree = (callback) => {
  const idTypeMethod = [Input.id(), Select.costType(), Select.method()];

  const length = MeasurementInput.len();
  const width = MeasurementInput.width();
  const depth = MeasurementInput.depth();
  const cost = MeasurementInput.cost();
  const lengthCost = [length, cost];
  const lengthWidthCost = [length, width, cost];
  const lengthWidthDepthCost = [length, width, depth, cost];
  const color = [Input.color()];

  const decisionInput = new DecisionInputTree('cost',
    idTypeMethod, callback);

  decisionInput.addStates({
    lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color
  });

  decisionInput.then(`method:${Cost.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  decisionInput.then(`method:${Cost.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  decisionInput.then(`method:${Cost.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  decisionInput.then(`method:${Cost.methods.UNIT}`)
        .jump('cost');
  decisionInput.then('type:Material').jump('color');

  return decisionInput;
}
