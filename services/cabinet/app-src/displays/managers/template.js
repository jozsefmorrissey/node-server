


const Assembly = require('../../objects/assembly/assembly.js');
const Input = require('../../../../../public/js/utils/input/input.js');
const Select = require('../../../../../public/js/utils/input/styles/select.js');
const MeasurementInput = require('../../../../../public/js/utils/input/styles/measurement.js');
const DecisionInputTree = require('../../../../../public/js/utils/input/decision/decision.js');
const Lookup = require('../../../../../public/js/utils/object/lookup.js');
const Inputs = require('../../input/inputs.js');
const CabinetTemplate = require('../../config/cabinet-template.js');
const ExpandableList = require('../../../../../public/js/utils/lists/expandable-list.js');
const $t = require('../../../../../public/js/utils/$t.js');
const du = require('../../../../../public/js/utils/dom-utils.js');
const RadioDisplay = require('../../display-utils/radio-display.js');
const Bind = require('../../../../../public/js/utils/input/bind.js');
const Joint = require('../../objects/joint/joint.js');
const StringMathEvaluator = require('../../../../../public/js/utils/string-math-evaluator.js');
const Measurement = require('../../../../../public/js/utils/measurement.js');
const ThreeView = require('../three-view.js');
const Layout2D = require('../../objects/layout.js');
const Draw2D = require('../../two-d/draw.js');
const cabinetBuildConfig = require('../../../public/json/cabinets.json');


const threeView = new ThreeView();
const containerClasses = {
  values: `template-values`,
  subassemblies: `template-subassemblies`,
  joints: `template-joints`,
  dividerJoint: `template-divider-joint`,
  openings: `template-openings`
};

function resetHeaderErrors() {
  const containers = du.find.all('.cabinet-template-input-cnt');
  containers.forEach((cnt) => {
    const headers = du.find.downAll('.expand-header', cnt);
    headers.forEach((h) => du.class.remove(h, 'error'))
  });
}

function setHeaderErrors(elem) {
  const firstHeader = du.find.closest('.expand-header', elem);
  const secondHeader = du.find.up('.cabinet-template-input-cnt', firstHeader).children[0];
  du.class.add(firstHeader, 'error');
  du.class.add(secondHeader, 'error');
}

function updateCss(elem, isValid, errorMsg) {
  if (isValid) {
    du.class.remove(elem, 'error');
    elem.setAttribute('error-msg', '');
  } else {
    du.class.add(elem, 'error');
    elem.setAttribute('error-msg', errorMsg);
    setHeaderErrors(elem);
  }
}

const varReg = /^[$_a-zA-Z][$_a-zA-Z0-9\.]*$/;
const variableNameCheck = (elem) => updateCss(elem, elem.value.match(varReg), `Illegal characters: ${varReg}`);
const positiveValueCheck = (elem) => updateCss(elem, Number.parseFloat(elem.value) > 0, 'Value must be positive');
const partCodeCheck = (template) => (elem) => updateCss(elem, template.validPartCode(elem.value), 'Invalid Part Code');

function openingCodeCheck(template, opening, input) {
  let count = 0;
  let errorString = '';
  if (!template.validPartCode(opening.top)) {count++; (errorString += 'top,');}
  if (!template.validPartCode(opening.bottom)) {count++; (errorString += 'bottom,');}
  if (!template.validPartCode(opening.left)) {count++; (errorString += 'left,');}
  if (!template.validPartCode(opening.right)) {count++; (errorString += 'right,');}
  if (!template.validPartCode(opening.back)) {count++; (errorString += 'back,');}
  if (count === 0) updateCss(input, true);
  else {
    errorString = errorString.substring(0, errorString.length - 1);
    if (count === 1) updateCss(input, false, `'${errorString}' part code is invalid (CABINET WILL NOT RENDER)`);
    else updateCss(input, false, `Multiple part codes are invalid: ${errorString} (CABINET WILL NOT RENDER)`);
  }
  return count === 0;
}

function openingsCodeCheck (template, inputs) {
  const openings = template.openings();
  let valid = true;
  for (let index = 0; index < openings.length; index += 1) {
    const opening = openings[index];
    const input = inputs[index];
    valid &&= openingCodeCheck(template, opening, input)
  }
  return valid;
}

function validateEquations(template, cabinet, valueInput, eqnInput, valueIndex, eqnMap) {
  let errorString = '';
  let errorCount = 0;
  let eqnKeys = Object.keys(eqnMap);
  for (let index = 0; index < eqnKeys.length; index += 1) {
    const key = eqnKeys[index];
    const eqn = eqnMap[key];
    if (index === valueIndex) {
      const value = template.evalEqn(eqn, cabinet);
      if (Number.isNaN(value)) {
        errorString += `${key},`;
        errorCount++;
      } else {
        valueInput.value = new Measurement(value).display();
      }
    } else {
      if (!template.validateEquation(eqn, cabinet)) {
        errorString += `${key},`;
        errorCount++;
      }
    }
  }
  if (errorCount > 0) {
    du.class.add(eqnInput, 'error');
    if (eqnKeys.length > 1) {
      errorString = errorString.substring(0, errorString.length - 1);
      updateCss(eqnInput, false, `Errors found within the following equations:${errorString}`);
    } else {
      updateCss(eqnInput, false, `Errors found within the equation.`)
    }
  } else {
    du.class.remove(eqnInput, 'error');
    updateCss(eqnInput, true);
  }
}

const valueEqnCheck = (template, cabinet) => (eqnInput) => {
  const valueInput = du.find.closest('[name="value"]', eqnInput);
  const name = eqnInput.name;
  const eqn = eqnInput.value;
  const eqnMap = {};
  eqnMap[name] = eqn;
  validateEquations(template, cabinet, valueInput, eqnInput, 0, eqnMap);
}

const xyzEqnCheck = (template, cabinet) => (xyzInput) => {
  const valueInput = du.find.closest('[name="value"]', xyzInput);
  const index = Number.parseInt(du.find.closest('select', xyzInput).value);
  const subAssem = ExpandableList.get(xyzInput);
  const part = cabinet.getAssembly(subAssem.code);
  const eqns = subAssem[xyzInput.name];
  const eqnMap = {x: eqns[0], y: eqns[1], z: eqns[2]};
  validateEquations(template, cabinet, valueInput, xyzInput, index, eqnMap);
}

function updatePartsDataList() {
  const partMap = threeView.partMap();
  if (!partMap) return;
  const partKeys = Object.keys(partMap);
  let html = '';
  for (let index = 0; index < partKeys.length; index += 1) {
    const key = partKeys[index];
    const value = partMap[key];
    html += `<option value='${key}'>${value}</option>`;
  }

  const datalist = du.id('part-list');
  datalist.innerHTML = html;
}

function onPartSelect(elem) {
  console.log(elem.value);
  threeView.isolatePart(elem.value);
  elem.value = '';
}

du.on.match('change', '.template-body>span>input[name="partSelector"]', onPartSelect);

const topView = du.id('three-view-top');
const leftView = du.id('three-view-left');
const frongView = du.id('three-view-front');
function validateOpenTemplate (elem) {
  const templateBody = du.find('.template-body[template-id]');
  if (!templateBody || du.is.hidden(templateBody)) return;
  resetHeaderErrors();
  const template = CabinetTemplate.get(templateBody.getAttribute('template-id'), templateBody);

  const valueNameInputs = du.find.downAll('input[attr="values"][name="name"]', templateBody);
  valueNameInputs.forEach(variableNameCheck);
  const subNameInputs = du.find.downAll('input[attr="subassemblies"][name="name"]', templateBody);
  subNameInputs.forEach(variableNameCheck);
  const subCodeInputs = du.find.downAll('input[attr="subassemblies"][name="code"]', templateBody);
  subCodeInputs.forEach(variableNameCheck);

  const positiveInputs = du.find.downAll('input[name="thickness"],input[name="width"],input[name="height"]', templateBody);
  positiveInputs.forEach(positiveValueCheck);

  const pcc = partCodeCheck(template);
  const jointMaleInputs = du.find.downAll('input[attr="joints"][name="malePartCode"]', templateBody);
  jointMaleInputs.forEach(pcc);
  const jointFemaleInputs = du.find.downAll('input[attr="joints"][name="femalePartCode"]', templateBody);
  jointFemaleInputs.forEach(pcc);

  const openingCodeInputs = du.find.downAll('input[attr="openings"][name="partCode"]', templateBody);
  openingsCodeCheck(template, openingCodeInputs);

  try {
    const templateCnt = du.find(`.template-body[template-id='${template.id()}'`);
    const height = new Measurement(templateBody.children[3].value, true).decimal();
    const width = new Measurement(templateBody.children[2].value, true).decimal();
    const thickness = new Measurement(templateBody.children[4].value, true).decimal();
    const cabinet = template.getCabinet(height, width, thickness);

    const depthInputs = du.find.downAll('[name=depth]', templateBody);
    depthInputs.forEach(valueEqnCheck(template, cabinet));
    const valueEqnInputs = du.find.downAll('input[attr="values"][name="eqn"]', templateBody);
    valueEqnInputs.forEach(valueEqnCheck(template, cabinet));
    const subDemInputs = du.find.downAll('input[attr="subassemblies"][name="demensions"]', templateBody);
    subDemInputs.forEach(xyzEqnCheck(template, cabinet));
    const subCenterInputs = du.find.downAll('input[attr="subassemblies"][name="center"]', templateBody);
    subCenterInputs.forEach(xyzEqnCheck(template, cabinet));
    const subRotInputs = du.find.downAll('input[attr="subassemblies"][name="rotation"]', templateBody);
    subRotInputs.forEach(xyzEqnCheck(template, cabinet));
    threeView.update(cabinet);
    setTimeout(updatePartsDataList, 500);
  } catch (e) {
    console.log(e);
  }


}

function getEqn(select, values) {
  return values && values[select.value()];
}

const depthValidation = (measurment) =>
        measurment.decimal() > 0;

function getJointInputTree(func, joint, dividerJoint) {
  const selectType = new Select({
    name: 'type',
    list: Object.keys(Joint.types),
    class: 'template-select',
    value: joint.type
  });

  const centerOffsetInput = new Select({
    name: 'centerAxis',
    list: ['+x', '+y', '+z', '-x', '-y', '-z'],
    value: joint.centerAxis
  });
  const demensionOffsetInput = new Select({
    name: 'demensionAxis',
    list: ['x', 'y', 'z'],
    value: joint.demensionAxis
  });

  const depthInput = new Input({
    name: 'depth',
    value: joint.maleOffset
  });

  const dadoInputs = dividerJoint ? [depthInput] : [depthInput, centerOffsetInput, demensionOffsetInput];

  const dit = new DecisionInputTree(undefined, {noSubmission: true});
  const type = dit.branch('Type', [selectType]);
  const condtionalPayload = new DecisionInputTree.ValueCondition('type', 'Dado', dadoInputs);
  type.conditional('dado', condtionalPayload);
  dit.onChange(func);
  return dit;
}

let lastDepth;
const jointOnChange = (vals, dit) => {
  const selectId = dit.payload().inputArray[0].id();
  const joint = ExpandableList.get(du.id(selectId));
  joint.type = vals.type;
  lastDepth = vals.depth || lastDepth;
  joint.maleOffset = lastDepth || undefined;
  const depthInput = dit.children()[0].payload().inputArray[0];
  // depthInput.updateDisplay();
  joint.demensionAxis = vals.demensionAxis || undefined;
  joint.centerAxis = vals.centerAxis || undefined;
  console.log(vals);
}

function getTypeInput() {
  return new Select({
    name: 'type',
    class: 'template-input',
    list: Object.keys(Assembly.components),
    inline: true
  });
}

function getXyzSelect(label) {
  return new Select({
    label,
    name: 'xyz',
    list: {'0': 'X', '1': 'Y', '2':'Z'},
    inline: true
  });
}

function getOpeningLocationSelect() {
  return new Select({
    name: 'openingLocation',
    list: ['top', 'bottom', 'left', 'right', 'back'],
    inline: true
  });
}

function getJoint(obj) {
  return {obj, jointInput: getJointInputTree(jointOnChange, obj).payload()};
}
function getSubassembly(obj) {
  return {typeInput:  getTypeInput(),
          centerXyzSelect: getXyzSelect('Center'),
          demensionXyzSelect: getXyzSelect('Demension'),
          rotationXyzSelect: getXyzSelect('Rotation'),
          getEqn, obj
        };
}

function getOpening(obj) {
  return {obj, select: getOpeningLocationSelect()};
}

const scopes = {};
function getScope(type, obj) {
  obj.id = obj.id || String.random();
  if (scopes[obj.id]) return scopes[obj.id];
  switch (type) {
    case 'joints':
      scopes[obj.id] = getJoint(obj);
      break;
    case 'subassemblies':
      scopes[obj.id] = getSubassembly(obj);
      break;
    case 'openings':
      scopes[obj.id] = getOpening(obj);
      break;
    default:
      scopes[obj.id] = {obj};
  }
  return scopes[obj.id];
}

function addExpandable(template, type) {
  const containerClass = containerClasses[type];
  let parentSelector = `[template-id='${template.id()}']>.${containerClass}`;
  console.log(parentSelector);
  TemplateManager.headTemplate[type] ||= new $t(`managers/template/${type.toKebab()}/head`);
  TemplateManager.bodyTemplate[type] = TemplateManager.bodyTemplate[type] === undefined ?
                    new $t(`managers/template/${type.toKebab()}/body`) : TemplateManager.bodyTemplate[type];
  let getHeader = (obj) => TemplateManager.headTemplate[type].render(getScope(type, obj));
  let getBody = TemplateManager.bodyTemplate[type] ? ((obj) => TemplateManager.bodyTemplate[type].render(getScope(type, obj))) : undefined;
  const expListProps = {
    idAttribute: 'name',
    list: template[type](),
    renderBodyOnOpen: false,
    parentSelector, getHeader, getBody,
    listElemLable: type.toSentance(),
  };
  const expandList = new ExpandableList(expListProps);
  return expandList;
}

class TemplateManager extends Lookup {
  constructor(id) {
    super(id);
    const parentId = `template-list-${this.id()}`;
    this.parentId = () => parentId;
    let currentTemplate;
    const parentSelector = `#${parentId}`;
    const dividerJointChange = (template) => (vals) => {
      template.dividerJoint(vals);
    }
    const dividerJointInput = (template) =>
      getJointInputTree(dividerJointChange(template), template.dividerJoint(), true).payload();

    const containerSelector = (template, containerClass) => `[template-id="${template.id()}"]>.${containerClass}`;

    const getHeader = (template) =>
      TemplateManager.headTemplate.render({template, TemplateManager: this});
    const getBody = (template) => {
      currentTemplate = template;
      setTimeout(() => validateOpenTemplate(du.id(parentId)), 1000);
      return TemplateManager.bodyTemplate.render({template, TemplateManager: this,
        containerClasses, dividerJointInput: dividerJointInput(template)});
      }

    function initTemplate(template) {
      return () => {
        addExpandable(template, 'values');
        addExpandable(template, 'subassemblies');
        addExpandable(template, 'joints');
        addExpandable(template, 'openings', true);
      };
    }

    const getObject = (values) => {
      const cabTemp = new CabinetTemplate(values.name);
      setTimeout(initTemplate(cabTemp), 200);
      return cabTemp;
    }

    this.active = () => expandList.active();
    const expListProps = {
      list: [new CabinetTemplate().fromJson(cabinetBuildConfig["standard"])],
      inputTree: TemplateManager.inputTree(),
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Template',
      type: 'sidebar'
    };
    setTimeout(initTemplate(expListProps.list[0]), 200);
    const expandList = new ExpandableList(expListProps);

    this.update = () => {
      const html = TemplateManager.mainTemplate.render(this);
      du.find(`#${id}`).innerHTML = html;
    }
    this.loadPoint = () => console.log('load');
    this.savePoint = () => console.log('save');
    this.fromJson = () => {};
    this.update();
  }
}

new RadioDisplay('cabinet-template-input-cnt', 'template-id');

TemplateManager.inputTree = () => {
  const dit = new DecisionInputTree();
  dit.leaf('Template Name', [Inputs('name')]);
  return dit;
}

TemplateManager.mainTemplate = new $t('managers/template/main');
TemplateManager.headTemplate = new $t('managers/template/head');
TemplateManager.bodyTemplate = new $t('managers/template/body');
TemplateManager.bodyTemplate.values = false;
TemplateManager.bodyTemplate.openings = false;
new TemplateManager('template-manager', 'template');

function updateValuesTemplate(elem, template) {
  const nameInput = du.find.closest('[name="name"]', elem);
  const name = nameInput.value;
  const eqn = du.find.closest('[name="eqn"]', elem).value;
  const valueObj = ExpandableList.get(elem);
  valueObj.key = name;
  valueObj.eqn = eqn;
  return true
}

function updateSubassembliesTemplate(elem, template) {
  const nameInput = du.find.closest('[name="name"]', elem);
  const type = du.find.closest('[name="type"]', elem).value;
  const name = `${type}.${nameInput.value.toDot()}`;
  const subAssem = ExpandableList.get(elem);
  subAssem.name = nameInput.value;
  if (elem.name === 'name') return;
  if (elem.name === 'center' || elem.name === 'demensions' || elem.name === 'rotation') {
    const index = du.find.closest('[name="xyz"]', elem).value;
    const eqn = elem.value;
    if (subAssem[elem.name] === undefined) subAssem[elem.name] = [];
    subAssem[elem.name][index] = eqn;
  } else if (elem.name !== 'name') {
    subAssem[elem.name] = elem.value;
  }

  console.log(ExpandableList.get(elem,1).toJson().subassemblies);
  console.log(ExpandableList.get(elem,1).toJson().subassemblies.center);
  console.log(ExpandableList.get(elem,1).toJson().subassemblies.demensions);
  console.log(ExpandableList.get(elem,1).toJson().subassemblies.rotation);
}

function switchEqn(elem) {
  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
  const template = CabinetTemplate.get(templateId);
  const nameInput = du.find.closest('[name="name"]', elem);
  const type = du.find.closest('[name="type"]', elem).value;
  const name = `${type}.${nameInput.value.toDot()}`;
  const subAssem = ExpandableList.get(elem);
  if (subAssem) {
    const eqnInput = du.find.closest('input', elem);
    const index = elem.value;
    if (subAssem[eqnInput.name] === undefined) subAssem[eqnInput.name] = [];
    const value = subAssem[eqnInput.name][index];
    eqnInput.value = value === undefined ? '' : value;
  }
}

function updateOpeningsTemplate(elem, template) {
  const partCode = elem.value;
  const attr = du.find.closest('select', elem).value;
  const listElem = ExpandableList.get(elem);
  listElem[attr] = elem.value;
  console.log(ExpandableList.get(elem,1).toJson());
}

function updateJointPartCode(elem) {
  const attr = elem.name;
  const listElem = ExpandableList.get(elem);
  listElem[attr] = elem.value;
}

function updateOpeningPartCode(elem) {
  const attr = elem.value;
  const listElem = ExpandableList.get(elem);
  const partCodeInput = du.find.closest('input', elem);
  partCodeInput.value = listElem[attr] || '';
}

function updateTemplate(elem, template) {
  const attr = du.find.closest('[attr]', elem).getAttribute('attr');
  switch (attr) {
    case 'values': return updateValuesTemplate(elem, template);
    case 'subassemblies': return updateSubassembliesTemplate(elem, template);
    case 'openings': return updateOpeningsTemplate(elem, template);

    default:

  }
}

du.on.match('change', '.opening-part-code-input', updateOpeningsTemplate);
du.on.match('change', '[name="xyz"]', switchEqn);
du.on.match('change', '[name="openingLocation"]', updateOpeningPartCode);
du.on.match('change', '.template-input[name="malePartCode"],.template-input[name="femalePartCode"]', updateJointPartCode);

du.on.match('change', '.template-input', function (elem) {
  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
  const template = CabinetTemplate.get(templateId);
  updateTemplate(elem, template);
});

du.on.match('change', 'input,select',   () => setTimeout(validateOpenTemplate, 0));


module.exports = TemplateManager
