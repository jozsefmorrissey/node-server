

const costTypes = ['Custom'];
class CostManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    const list = [];

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
          ['Opening'].concat(Object.keys(Assembly.classes)
              .filter((id) => !id.match(/^.*Section$/)));
      CostManager.partList.sort();
      CostManager.partList.forEach((id) => {
        const parentId = `cost-group-${randomString()}`;
        const expListProps = {
          list: json[id] ? Cost.fromJson(json[id]) : [],
          inputValidation: () => true,
          parentId,
          parentSelector: `#${parentId}`,
          inputTree:   CostManager.costInputTree(costTypes, id, CostManager.onUpdate),
          getHeader: CostManager.costHeader,
          getBody: CostManager.costBody,
          getObject: CostManager.getCostObject(id),
          listElemLable: 'Cost'
        };
        const requiredProps = assemProperties(id);
        const expandList = new ExpandableList(expListProps);
        list.push({partId: id, expandList, requiredProps, cntClass: CostManager.cntClass, parentId});
      });
      propertyDisplay.update();
      return list;
    }

    this.Cost = Cost;
    this.globalProps = () => assemProperties(name)

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
CostManager.cntClass = 'cost-manager-reference-cnt';

CostManager.onUpdate = (name, value, target) => {
  if (name === 'costType') {
    const refCnt = up(`.${CostManager.cntClass}`, target).children[1];
    if (value !== 'Custom') refCnt.hidden = false;
    else refCnt.hidden = true;
  }
};

CostManager.setInstanceProps = (scope) => {
  const parent = document.getElementById(scope.parentId);
  if (scope.instanceProps !== undefined) return scope;
  if (parent === null) return undefined;



  const expandLists = upAll('.expand-body', parent);
  let instanceProps = {};
  if (expandLists.length === 2) {
    const partId = expandLists[1].parentElement.children[1].children[0]
                      .getAttribute('part-id');
    scope.instanceProps = assemProperties(partId).instance;
  }
}

CostManager.childScopes = {};
CostManager.childScope = (cost) => {
  if (CostManager.childScopes[cost.uniqueId()] === undefined) {
    const parentId = `cost-child-group-${randomString()}`;
    const expListProps = {
      list: cost.children,
      inputValidation: () => true,
      parentSelector: `#${parentId}`,
      inputTree:   CostManager.costInputTree(costTypes, undefined, CostManager.onUpdate),
      getHeader: CostManager.costHeader,
      getBody: CostManager.costBody,
      getObject: CostManager.getCostObject(cost.id()),
      listElemLable: 'Cost'
    };
    const expandList = new ExpandableList(expListProps);

    CostManager.childScopes[cost.uniqueId()] = {expandList, cost, parentId,
          CostManager};
  }
  const scope = CostManager.childScopes[cost.uniqueId()];
  CostManager.setInstanceProps(scope);
  return scope;
}

CostManager.getCostObject = (id) => (values) => {
  const obj = CostManager.getObject(values);
  if (values.referenceable) costTypes.push(values.id);
  return obj;
};

CostManager.isInstance = (target) => upAll('.expandable-list', el).length === 2;
CostManager.costHeader = (cost) => CostManager.costHeadTemplate.render(cost);
CostManager.costBody = (cost) => CostManager.costBodyTemplate.render(CostManager.childScope(cost));
CostManager.getObject = (values) => {
  if (values.costType === 'Custom') {
    return Cost.new(values);
  } else {
    const referenceCost = Cost.get(values.costType);
    if (referenceCost === undefined) throw new Error('Invalid Cost reference name');
    return Cost.new({type: referenceCost.constructor.name, referenceCost, formula: values.formula});
  }
}

afterLoad.push(() => {
  // Todo do a valid test for input... probably need to make a sample cabinet
  const sectionScope = {l: 0, w:0, d:0, fpt: 0, fpb: 0, fpr: 0, fpl: 0, ppt: 0, ppb: 0, ppl: 0, ppr: 0};
  const defaultScope = {l: 0, w:0, d:0};
  const sectionEval = new StringMathEvaluator(sectionScope);
  const defaultEval = new StringMathEvaluator(defaultScope);
  const sectionObjs = ['Door', 'DrawerFront', 'DrawerBox', 'Opening'];

  const validate = (objId, type) => (formula) => {
    if (type === 'Labor' || sectionObjs.indexOf(objId) === -1)
      return !Number.isNaN(defaultEval.eval(formula));
    return !Number.isNaN(sectionEval.eval(formula));
  }

  const sectionInput = () => new Input({
    name: 'formula',
    placeholder: 'Formula',
    validation: validate('Door'),
    class: 'center',
    errorMsg: `Invalid Formula: allowed variables...
    <br>l - length
    <br>w - width
    <br>d - depth/thickness
    <br>fp[tblr] - Frame postion [top, bottom, left, right]
    <br>pp[tblr] - Panel Postion [top, bottom, left, right]`
  });
  const defaultInput = () => new Input({
    name: 'formula',
    placeholder: 'Formula',
    validation: validate(),
    class: 'center',
    errorMsg: `Invalid Formula: allowed variables...
    <br>l - length
    <br>w - width
    <br>d - depth/thickness`
  });

  CostManager.formulaInput = (objId, type) => {
    if (type === 'Labor' ||
          sectionObjs.indexOf(objId) === -1)
      return defaultInput();
    return sectionInput();
  };
});

CostManager.costInputTree = (costTypes, objId, onUpdate) => {
  const costTypeSelect = new Select({
    name: 'costType',
    value: 'Custom',
    class: 'center',
    list: Cost.defined
  });
  const reference = new Input({
    name: 'referenceable',
    label: 'Referenceable',
    type: 'checkbox',
    default: false,
    validation: [true, false],
    targetAttr: 'checked',
    value: objId === undefined ? false : true,
  });
  const objectId = new Input({
    name: 'objectId',
    hide: true,
    value: objId
  });

  const id = Input.CostId();
  const laborType = Input.laborType();
  const hourlyRate = Input.hourlyRate();

  const idType = [objectId, id, Select.costType()];
  const materialInput = [Select.method(), Select.company(), Input.partNumber()];
  const laborInput = [Select.method(), laborType, hourlyRate];
  laborType.on('keyup',
    (val, values) => hourlyRate.setValue(Labor.hourlyRate(val)));

  const length = MeasurementInput.len();
  const width = MeasurementInput.width();
  const depth = MeasurementInput.depth();
  const cost = MeasurementInput.cost();
  const hours = Input.hours();
  const count = Input.count();
  const optional = Input.optional();
  const modifyDemension = Input.modifyDemension();
  const selectInfo = [CostManager.formulaInput(objId, 'Select'),
                      RelationInput, optional];
  const color = [Input.color()];

  // Todo: ????
  const matFormula = CostManager.formulaInput(objId, 'Material');
  const costCount = [count, cost, matFormula];
  const lengthCost = [length, cost, matFormula];
  const lengthWidthCost = [length, width, cost, matFormula];
  const lengthWidthDepthCost = [length, width, depth, cost, matFormula];

  const laborFormula = CostManager.formulaInput(objId, 'Labor');
  const hourlyCount = [count, hours, laborFormula];
  const lengthHourly = [length, hours, laborFormula];
  const lengthWidthHourly = [length, width, hours, laborFormula];
  const lengthWidthDepthHourly = [length, width, depth, hours, laborFormula];

  const decisionInput = new DecisionInputTree('cost',
    [costTypeSelect, reference]);

  decisionInput.contengency('id', 'referenceable');
  decisionInput.onChange(onUpdate);

  decisionInput.addStates({
    lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color,idType,
    laborInput, costCount, optional, materialInput, selectInfo, hourlyCount,
    lengthHourly, lengthWidthHourly, lengthWidthDepthHourly, modifyDemension
  });

  const idTypeNode = decisionInput.then('costType:Custom')
        .jump('idType');


  const materialNode = idTypeNode.then('type:Material')
        .jump('materialInput');
  const selectNode = idTypeNode.then('type:Select')
        .jump('selectInfo');
  const laborNode = idTypeNode.then('type:Labor')
        .jump('laborInput');
  idTypeNode.then('type:Category').jump('optional');

  idTypeNode.then('id:length').jump('modifyDemension');
  idTypeNode.then('id:width').jump('modifyDemension');
  idTypeNode.then('id:depth').jump('modifyDemension');


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
        .jump('lengthHourly');
  laborNode.then(`method:${Cost.methods.SQUARE_FEET}`)
        .jump('lengthWidthHourly');
  laborNode.then(`method:${Cost.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthHourly');
  laborNode.then(`method:${Cost.methods.UNIT}`)
        .jump('hourlyCount');

  laborNode.then('type:Material').jump('color');

  return decisionInput;
}
