

class CostManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const costs = {};
    const costTypes = ['Custom'];
    const cntClass = 'cost-manager-reference-cnt';

    const getCostObject = (id) => (values) => {
      const obj = CostManager.getObject(values);
      if (id === 'Define') costTypes.push(values.id);
      return obj;
    }

    const onUpdate = (name, value, target) => {
      if (name === 'costType') {
        const refCnt = up(`.${cntClass}`, target).children[1];
        if (value !== 'Custom') refCnt.hidden = false;
        else refCnt.hidden = true;
      }
    }

    this.loadPoint = () => EPNTS.costs.get();
    this.savePoint = () => EPNTS.costs.save();
    this.fromJson = () => {
      CostManager.partList = CostManager.partList ||
          ['Define'].concat(Object.keys(Assembly.classes)
              .filter((id) => !id.match(/^.*Section$/)));
      const list = [];
      CostManager.partList.forEach((id) => {
        const parentId = `cost-group-${randomString()}`;
        const expListProps = {
          list: [],
          inputValidation: () => true,
          parentId,
          parentSelector: `#${parentId}`,
          inputTree:   CostManager.costInputTree(costTypes, id === 'Define', onUpdate),
          getHeader: CostManager.costHeader,
          getBody: CostManager.costBody,
          getObject: getCostObject(id),
          listElemLable: 'Cost'
        };
        const expandList = new ExpandableList(expListProps);
        list.push({partId: id, expandList, cntClass, parentId});
      });
      return list;
    }

    this.Cost = Cost;

    const getHeader = (costGroup) => CostManager.costHeadTemplate(costGroup);
    const getBody = (costGroup) => CostManager.costBodyTemplate(costGroup);
    const getObject = (values) => {
      const obj = {partId: values.partId, costs: []};
      return obj;
    }
  }
}

new CostManager('cost-manager', 'cost');

CostManager.headTemplate = new $t('managers/cost/head');
CostManager.bodyTemplate = new $t('managers/cost/body');
CostManager.costHeadTemplate = new $t('managers/cost/cost-head');
CostManager.costBodyTemplate = new $t('managers/cost/cost-body');

CostManager.costHeader = (scope) => CostManager.costHeadTemplate.render(scope);
CostManager.costBody = (scope) => CostManager.costBodyTemplate.render(scope);
CostManager.getObject = (values) => {
  if (values.costType === 'Custom') {
    return Cost.new(values.type, values.id, values.method, values.cost,
            values.length, values.width, values.depth, values.formula);
  } else {
    const refCost = Cost.get(values.costType);
    if (refCost === undefined) throw new Error('Invalid Cost reference name');
    return new Cost(values.id, refCost, values.formula);
  }
}

afterLoad.push(() => {
  CostManager.testEval = new StringMathEvaluator(null,
    (attr, assem) => Assembly.resolveAttr(assem, attr));
    CostManager.dummyAssembly = new Frame('dummy', '', '0,0,0','2,3,5');
    CostManager.eval = (formula) => {
      return !Number.isNaN(CostManager.testEval.eval(formula, CostManager.dummyAssembly));
    };
});

CostManager.costInputTree = (costTypes, hideCostTypes, onUpdate) => {
  const costTypeSelect = new Select({
    name: 'costType',
    value: 'Custom',
    hide: hideCostTypes,
    class: 'center',
    list: costTypes
  });
  const formula = new Input({
    name: 'formula',
    placeholder: 'Formula',
    validation: CostManager.eval,
    class: 'center',
    errorMsg: 'Invalid Formula: allowed variables [lwd]'
  });
  const id = Input.id();

costTypeSelect
  const idTypeMethod = [id, Select.type(), Select.method(),
          formula, Input.optional()];
  const idFormula = [id, formula];

  const length = MeasurementInput.len();
  const width = MeasurementInput.width();
  const depth = MeasurementInput.depth();
  const cost = MeasurementInput.cost();
  const lengthCost = [length, cost];
  const lengthWidthCost = [length, width, cost];
  const lengthWidthDepthCost = [length, width, depth, cost];
  const color = [Input.color()];

  const decisionInput = new DecisionInputTree('cost',
    costTypeSelect);
  decisionInput.onChange(onUpdate);

  decisionInput.addStates({
    lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color,idTypeMethod, idFormula
  });

  decisionInput.then('costType').jump('idFormula');
  const idTypeMethNode = decisionInput.then('costType:Custom')
        .jump('idTypeMethod');

  idTypeMethNode.then(`method:${Cost.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  idTypeMethNode.then(`method:${Cost.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  idTypeMethNode.then(`method:${Cost.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  idTypeMethNode.then(`method:${Cost.methods.UNIT}`)
        .jump('cost');

  idTypeMethNode.then('type:Material').jump('color');

  return decisionInput;
}
