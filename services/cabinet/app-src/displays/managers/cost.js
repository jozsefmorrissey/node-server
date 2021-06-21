

class CostManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const costs = {};
    this.loadPoint = () => EPNTS.costs.get();
    this.savePoint = () => EPNTS.costs.save();
    this.fromJson = () => {
      CostManager.partList = CostManager.partList ||
          Object.keys(Assembly.classes).filter((id) => !id.match(/^.*Section$/));
      const list = [];
      CostManager.partList.forEach((id) => {
        const expListProps = {
          list: [],
          inputValidation: () => true,
          inputTree:   CostManager.costInputTree(),
          getHeader: CostManager.costHeader,
          getBody: CostManager.costBody,
          getObject: CostManager.getObject,
          listElemLable: 'Cost'
        };
        const expandList = new ExpandableList(expListProps);
        list.push({partId: id, expandList});
      });
      return list;
    }

    this.Cost = Cost;

    const getHeader = (costGroup) => CostManager.costHeadTemplate(costGroup);
    const getBody = (costGroup) => CostManager.costBodyTemplate(costGroup);
    const getObject = (values) => ({partId: values.partId, costs: []});
  }
}

new CostManager('cost-manager', 'cost');

CostManager.headTemplate = new $t('managers/cost/head');
CostManager.bodyTemplate = new $t('managers/cost/body');
CostManager.costHeadTemplate = new $t('managers/cost/cost-head');
CostManager.costBodyTemplate = new $t('managers/cost/cost-body');

CostManager.costHeader = (scope) => CostManager.costHeadTemplate.render(scope);
CostManager.costBody = (scope) => CostManager.costBodyTemplate.render(scope);
CostManager.getObject = (values) =>
  Cost.new(values.type, values.id, values.method, values.cost, values.length, values.width, values.depth);

CostManager.costInputTree = (callback) => {
  const idTypeMethod = [Input.id(), Select.type(), Select.method(), Input.optional()];

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
