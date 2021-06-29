

const costTypes = ['Custom'];
class CostManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const list = [];
    const cntClass = 'cost-manager-reference-cnt';

    this.toJson = () => {
      const json = {};
      list.forEach((listObj) => {
        json[listObj.partId] = [];
          listObj.expandList.getList().forEach((cost) =>
              json[listObj.partId].push(cost.toJson()));
      });
      return json;
    };

    this.loadPoint = () => EPNTS.costs.get();
    this.savePoint = () => EPNTS.costs.save();
    this.fromJson = (json) => {
      CostManager.partList = CostManager.partList ||
          [].concat(Object.keys(Assembly.classes)
              .filter((id) => !id.match(/^.*Section$/)));
      CostManager.partList.forEach((id) => {
        const parentId = `cost-group-${randomString()}`;
        const expListProps = {
          list: json[id] ? Cost.fromJson(json[id]) : [],
          inputValidation: () => true,
          parentId,
          parentSelector: `#${parentId}`,
          inputTree:   CostManager.costInputTree(costTypes, id === 'Define', CostManager.onUpdate),
          getHeader: CostManager.costHeader,
          getBody: CostManager.costBody,
          getObject: CostManager.getCostObject(id),
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

CostManager.onUpdate = (name, value, target) => {
  if (name === 'costType') {
    const refCnt = up(`.${cntClass}`, target).children[1];
    if (value !== 'Custom') refCnt.hidden = false;
    else refCnt.hidden = true;
  }
};

CostManager.childScopes = {};
CostManager.childScope = (cost) => {
  if (CostManager.childScopes[cost.id()] === undefined) {
    const parentId = `cost-child-group-${randomString()}`;
    const expListProps = {
      list: cost.children,
      inputValidation: () => true,
      parentSelector: `#${parentId}`,
      inputTree:   CostManager.costInputTree(costTypes, cost.id() === 'Define', CostManager.onUpdate),
      getHeader: CostManager.costHeader,
      getBody: CostManager.costBody,
      getObject: CostManager.getCostObject(cost.id()),
      listElemLable: 'Cost'
    };
    const expandList = new ExpandableList(expListProps);
    CostManager.childScopes[cost.id()] = {expandList, cost, parentId};
  }

  return CostManager.childScopes[cost.id()];
}

CostManager.getCostObject = (id) => (values) => {
  const obj = CostManager.getObject(values);
  if (values.costType === 'Custom') costTypes.push(values.id);
  return obj;
};

CostManager.costHeader = (cost) => CostManager.costHeadTemplate.render(cost);
CostManager.costBody = (cost) => CostManager.costBodyTemplate.render(CostManager.childScope(cost));
CostManager.getObject = (values) => {
  if (values.costType === 'Custom') {
    return Cost.new(values);
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
  const idType = [id, Select.costType()];
  const materialInput = [Select.method(), Select.company(), Input.partNumber()];
  const laborInput = [Select.method()];

  const length = MeasurementInput.len();
  const width = MeasurementInput.width();
  const depth = MeasurementInput.depth();
  const cost = MeasurementInput.cost();
  const count = Input.count();
  const costCount = [cost, count, formula];
  const lengthCost = [length, cost, formula];
  const lengthWidthCost = [length, width, cost, formula];
  const lengthWidthDepthCost = [length, width, depth, cost, formula];
  const color = [Input.color()];
  const optional = Input.optional();

  const decisionInput = new DecisionInputTree('cost',
    costTypeSelect);
  decisionInput.onChange(onUpdate);

  decisionInput.addStates({
    lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color,idType,
    laborInput, costCount, optional, materialInput
  });

  const idTypeNode = decisionInput.then('costType:Custom')
        .jump('idType');


  const materialNode = idTypeNode.then('type:Material')
        .jump('materialInput');
  const laborNode = idTypeNode.then('type:Labor')
        .jump('laborInput');
  idTypeNode.then('type:Category').jump('optional');


  materialNode.then(`method:${Cost.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  materialNode.then(`method:${Cost.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  materialNode.then(`method:${Cost.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  materialNode.then(`method:${Cost.methods.UNIT}`)
        .jump('costCount');

  materialNode.then('type:Material').jump('color');


  laborNode.then(`method:${Cost.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  laborNode.then(`method:${Cost.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  laborNode.then(`method:${Cost.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  laborNode.then(`method:${Cost.methods.UNIT}`)
        .jump('costCount');

  laborNode.then('type:Material').jump('color');

  return decisionInput;
}
