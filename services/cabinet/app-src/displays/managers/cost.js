


const AbstractManager = require('../abstract-manager.js');
const Assembly = require('../../objects/assembly/assembly.js');
const Cost = require('../../cost/cost.js');
const SelectCost = require('../../cost/types/select.js');
const ExpandableList = require('../../../../../public/js/utils/lists/expandable-list.js');
const Select = require('../../../../../public/js/utils/input/styles/select.js');
const du = require('../../../../../public/js/utils/dom-utils.js');
const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
const Door = require('../../objects/assembly/assemblies/door/door.js');
const DrawerFront = require('../../objects/assembly/assemblies/drawer/drawer-front.js');
const DrawerBox = require('../../objects/assembly/assemblies/drawer/drawer-box.js');
const Labor = require('../../cost/types/material/labor.js');
const Input = require('../../../../../public/js/utils/input/input.js');
const Frame = require('../../objects/assembly/assemblies/frame.js');
const Panel = require('../../objects/assembly/assemblies/panel.js');
const MeasurementInput = require('../../../../../public/js/utils/input/styles/measurement.js');
const RelationInput = require('../../../../../public/js/utils/input/styles/select/relation.js');
const Material = require('../../cost/types/material.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const Inputs = require('../../input/inputs.js');
const $t = require('../../../../../public/js/utils/$t.js');
const EPNTS = require('../../../generated/EPNTS.js');
const Displays = require('../../services/display-svc.js');
const propertyDisplay = Displays.get('propertyDisplay');
const Properties = require('../../config/properties.js');



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
    this.costTypeHtml = CostManager.costTypeHtml;
    this.fromJson = (json) => {
      CostManager.partList = CostManager.partList ||
          Properties.list();
      CostManager.partList.sort();
      CostManager.partList.forEach((id) => {
        const parentId = `cost-group-${String.random()}`;
        const expListProps = {
          list: json[id] ? Cost.fromJson(json[id]) : [],
          inputValidation: () => true,
          parentId,
          parentSelector: `#${parentId}`,
          inputTree:   CostManager.costInputTree(costTypes, id),
          getHeader: CostManager.costHeader,
          getBody: CostManager.costBody,
          getObject: CostManager.getCostObject(id),
          listElemLable: `Cost to ${id}`
        };
        const cost = new SelectCost({id, referenceable: true, children: expListProps.list});
        const staticProps = Properties(id);
        const expandList = new ExpandableList(expListProps);
        list.push({partId: id, expandList, staticProps,
          CostManager: CostManager, parentId, cost});
      });
      propertyDisplay.update();
      return list;
    }

    this.Cost = Cost;
    this.globalProps = () => Properties(name)

    const getHeader = (costGroup) => CostManager.costHeadTemplate(costGroup.instance);
    const getBody = (costGroup) => CostManager.costBodyTemplate(costGroup.instance);
    const getObject = (values) => {
      const obj = {partId: values.partId, costs: []};
      return obj;
    }

    this.load();
  }
}

CostManager.headTemplate = new $t('managers/cost/head');
CostManager.bodyTemplate = new $t('managers/cost/body');
CostManager.costHeadTemplate = new $t('managers/cost/cost-head');
CostManager.costBodyTemplate = new $t('managers/cost/cost-body');
CostManager.cntClass = 'cost-manager-reference-cnt';
CostManager.selectInput = (cost) => Inputs('childCost', { value: cost.selectedId, list: cost.childIds() });

CostManager.setInstanceProps = (scope) => {
  const parent = du.id(scope.parentId);
  if (scope.instanceProps !== undefined) return scope;
  if (parent === null) return undefined;



  const expandLists = du.find.upAll('.expand-body', parent);
  let instanceProps = {};
  if (expandLists.length === 2) {
    const partId = expandLists[1].parentElement.children[1].children[0]
                      .getAttribute('part-id');
    scope.instanceProps = Properties(partId).instance;
  }
}

CostManager.childScopes = {};
CostManager.childScope = (cost) => {
  if (CostManager.childScopes[cost.uniqueId()] === undefined) {
    const parentId = `cost-child-group-${String.random()}`;
    const expListProps = {
      list: cost.children,
      inputValidation: () => true,
      parentSelector: `#${parentId}`,
      inputTree:   CostManager.costInputTree(costTypes, undefined),
      getHeader: CostManager.costHeader,
      getBody: CostManager.costBody,
      getObject: CostManager.getCostObject(cost.id()),
      listElemLable: `Cost to ${cost.id()}`
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

CostManager.typeTemplates = {};
CostManager.costTypeHtml = (cost, scope) => {
  const constName = cost.constructor.name;
  if (CostManager.typeTemplates[constName])
    return CostManager.typeTemplates[constName].render(scope);
  const fileId = `managers/cost/types/${Cost.constructorId(constName).toLowerCase()}`;
  if ($t.isTemplate(fileId)) {
    template = new $t(fileId);
    CostManager.typeTemplates[constName] = template;
    return template.render(scope);
  }
  return 'nada';
}



CostManager.isInstance = (target) => du.find.upAll('.expandable-list', el).length === 2;
CostManager.costHeader = (cost) => CostManager.costHeadTemplate.render(cost);
CostManager.costBody = (cost) => cost instanceof Cost && CostManager.costBodyTemplate.render(CostManager.childScope(cost));
CostManager.getObject = (values) => {
  if (values.costType === '/dev/nul') {
    return Cost.new(values);
  } else {
    const referenceCost = Cost.get(values.costType);
    if (referenceCost === undefined) throw new Error('Invalid Cost reference name');
    return Cost.new({type: referenceCost.constructor.name, referenceCost, formula: values.formula});
  }
}

CostManager.costInputTree = (costTypes, objId, onUpdate) => {

  const costTypeSelect = new Select({
    name: 'costType',
    value: '/dev/nul',
    class: 'center',
    list: Cost.group().defined
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

  costTypeSelect.on('change',
    (val) => {
      if (val !== '/dev/nul') {
        reference.setValue(false);
        reference.hide();
      } else {
        reference.show();
      }
    });

  const id = Inputs('costId');
  const laborType = Inputs('laborType');
  const hourlyRate = Inputs('hourlyRate');

  const idType = [objectId, id, Inputs('costType')];
  const materialInput = [Inputs('method'), Inputs('company'), Inputs('partNumber')];
  const laborInput = [Inputs('method'), laborType, hourlyRate];
  laborType.on('keyup',
    (val, values) => hourlyRate.setValue(Labor.hourlyRate(val)));

  const length = Inputs('length');
  const width = Inputs('width');
  const depth = Inputs('depth');
  const cost = Inputs('cost');
  const hours = Inputs('hours');
  const count = Inputs('count');
  const modifyDemension = Inputs('modifyDemension');
  const selectInfo = [CostManager.formulaInput(objId, 'Select'),
                      RelationInput.selector];
  const conditionalInfo = [Inputs('propertyId'), Inputs('propertyConditions'),
        Inputs('propertyValue')];
  const color = [Inputs('color')];

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
    laborInput, costCount, materialInput, selectInfo, hourlyCount,
    lengthHourly, lengthWidthHourly, lengthWidthDepthHourly, modifyDemension,
    conditionalInfo
  });

  const idTypeNode = decisionInput.then('costType:/dev/nul')
        .jump('idType');


  const conditionalNode = idTypeNode.then('type:Conditional')
        .jump('conditionalInfo');
  const materialNode = idTypeNode.then('type:Material')
        .jump('materialInput');
  const selectNode = idTypeNode.then('type:Select')
        .jump('selectInfo');
  const laborNode = idTypeNode.then('type:Labor')
        .jump('laborInput');

  idTypeNode.then('id:length').jump('modifyDemension');
  idTypeNode.then('id:width').jump('modifyDemension');
  idTypeNode.then('id:depth').jump('modifyDemension');


  materialNode.then(`method:${Material.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  materialNode.then(`method:${Material.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  materialNode.then(`method:${Material.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  materialNode.then(`method:${Material.methods.UNIT}`)
        .jump('costCount');

  materialNode.then('type:Material').jump('color');


  laborNode.then(`method:${Material.methods.LINEAR_FEET}`)
        .jump('lengthHourly');
  laborNode.then(`method:${Material.methods.SQUARE_FEET}`)
        .jump('lengthWidthHourly');
  laborNode.then(`method:${Material.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthHourly');
  laborNode.then(`method:${Material.methods.UNIT}`)
        .jump('hourlyCount');

  laborNode.then('type:Material').jump('color');

  return decisionInput;
}


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

module.exports = CostManager
