

const FunctionCache = require('../../../../../public/js/utils/services/function-cache.js');

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
const Snap2d = require('../../two-d/objects/snap');
const cabinetBuildConfig = require('../../../public/json/cabinets.json');

let template;
let modifyingOpening = false;

FunctionCache.disable();
function getCabinet(elem) {
  const templateBody = du.find.closest(`.template-body[template-id]`, elem);
  const template = CabinetTemplate.get(templateBody.getAttribute('template-id'), templateBody);
  const height = new Measurement(templateBody.children[3].value, true).decimal();
  const width = new Measurement(templateBody.children[2].value, true).decimal();
  const thickness = new Measurement(templateBody.children[4].value, true).decimal();
  const cabinet = template.getCabinet(height, width, thickness);
  console.log(`Cabinet Demesions: ${cabinet.width()} !== ${cabinet.eval('c.w')} x ${cabinet.length()} x ${cabinet.thickness()}`)
  return cabinet;
}

const toDisplay = (value) =>  new Measurement(value).display();
const threeView = new ThreeView();
du.on.match('click', '#template-list-TemplateManager_template-manager', (elem) =>
  du.move.inFront(elem));
du.on.match('click', `#${threeView.id()}>.three-view-two-d-cnt>.three-view-canvases-cnt`, (elem) =>
  du.move.inFront(elem));

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
  if (opening._Type === 'location') return true;
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
        const convertCheckBox = valueInput.nextElementSibling;
        if (convertCheckBox && convertCheckBox.getAttribute('name') === 'convert' &&
              convertCheckBox.checked) {
          valueInput.value = new Measurement(value).display();
        } else {
          valueInput.value = value;
        }
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
    const id = partKeys[index];
    const partCode = partMap[id].code;
    const partName = partMap[id].name;
    html += `<option value='${partCode}'></option>`;
  }

  const datalist = du.id('part-list');
  datalist.innerHTML = html;
}

function onPartSelect(elem) {
  console.log(elem.value);
  threeView.isolatePart(elem.value, template);
  elem.value = '';
}

function updateOpenLocationDisplay (opening, elem) {
  const state = opening.locationState;

  const io = state.innerOouter ? 'inner' : 'outer';
  const tb = state.topObottom ? 'top' : 'bottom';
  const lr = state.leftOright ? 'left' : 'right';
  const description = `Current formula describes the ${io} boundry ${tb} ${lr} corner, the ${state.xOyOz} coordinate.`;
  du.find.closest('.opening-location-description-cnt', elem).innerText = description;

  const targetPoint = opening[io][tb][lr];

  if (elem.name !== 'opening-coordinate-value')
    du.find.closest('[name="opening-coordinate-value"]', elem).value = targetPoint[state.xOyOz];
  else targetPoint[state.xOyOz] = elem.value;

  const cabinet = getCabinet(elem);
    console.log(cabinet.width());
    const x = new Measurement(cabinet.eval(targetPoint.x)).display();
    const y = new Measurement(cabinet.eval(targetPoint.y)).display();
    const z = new Measurement(cabinet.eval(targetPoint.z)).display();

    const position = `(${x}, ${y}, ${z})`;
    du.find.closest('.opening-location-value-cnt', elem).innerText = position;
}

const changeEvent = new Event("change");
function onOpeningLocationChange(elem) {
  const opening = ExpandableList.get(elem);
  const state = opening.locationState;
  let value = elem.value;
  if (value === 'true') value = true;
  else if (value === 'false') value = false;
  const attr = elem.name.replace(/(.*?)-.*/, '$1');
  state[attr] = value;

  updateOpenLocationDisplay(opening, elem);
}

function onOpeningTypeChange(elem) {
  const opening = ExpandableList.get(elem);
  if (opening._Type !== elem.value) {
    const isLocation = elem.value === 'location';
    const defaultFunc = isLocation ? 'defaultLocationOpening' : 'defaultPartCodeOpening';
    const def = CabinetTemplate[defaultFunc]();
    Object.merge(opening, def, true);
    opening._Type = elem.value;
    du.find.closest('.border-location-cnt', elem).hidden = !isLocation;
    du.find.closest('.border-part-code-cnt', elem).hidden = isLocation;
    updateOpeningPartCode(du.find.closest('select', elem));
  }
}

du.on.match('change', '.border-location-cnt>input', onOpeningLocationChange);
du.on.match('change', '.opening-type-selector', onOpeningTypeChange);
du.on.match('change', '.template-body>span>input[name="partSelector"]', onPartSelect);

function updateOpeningPoints(template, cabinet) {
  const threeDModel = threeView.threeDModel();
  if (threeDModel) {
    threeDModel.removeAllExtraObjects();
    const openings = template.openings();
    for (let index = 0; index < openings.length; index++) {
      const opening = openings[index];
      if (opening._Type === 'location') {
        const size = modifyingOpening ? 1 : .25;
        const state = opening.locationState;
        const vertexColor = (io, tb, lr) => io !== state.innerOouter ? 'black' :
        (modifyingOpening && tb === state.topObottom && lr === state.leftOright ? 'lime' : 'white');

        const vertexSize = (io) => modifyingOpening && io === state.innerOouter ? size*2 : size;

        threeDModel.addVertex(cabinet.evalObject(opening.inner.top.left), vertexSize(true), vertexColor(true, true, true));
        threeDModel.addVertex(cabinet.evalObject(opening.inner.top.right), vertexSize(true), vertexColor(true, true, false));
        threeDModel.addVertex(cabinet.evalObject(opening.inner.bottom.left), vertexSize(true), vertexColor(true, false, true));
        threeDModel.addVertex(cabinet.evalObject(opening.inner.bottom.right), vertexSize(true), vertexColor(true, false, false));

        threeDModel.addVertex(cabinet.evalObject(opening.outer.top.left), vertexSize(false), vertexColor(false, true, true));
        threeDModel.addVertex(cabinet.evalObject(opening.outer.top.right), vertexSize(false), vertexColor(false, true, false));
        threeDModel.addVertex(cabinet.evalObject(opening.outer.bottom.left), vertexSize(false), vertexColor(false, false, true));
        threeDModel.addVertex(cabinet.evalObject(opening.outer.bottom.right), vertexSize(false), vertexColor(false, false, false));
      }
    }
  }
}

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
    const cabinet = getCabinet(templateBody);

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
    updateOpeningPoints(template, cabinet);
    // cabinet.openings[0].divide(0);
    cabinet.openings[0].setSection('DoorSection', 0)
    // threeView.update(cabinet);
    // setTimeout(updatePartsDataList, 500);
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
  joint.type ||= 'Butt';
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
    name: 'maleOffset',
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
  lastDepth = vals.maleOffset || lastDepth;
  joint.maleOffset = lastDepth || undefined;
  const depthInput = dit.children()[0].payload().inputArray[0];
  // depthInput.updateDisplay();
  joint.demensionAxis = vals.demensionAxis || undefined;
  joint.centerAxis = vals.centerAxis || undefined;
  console.log(vals);
}

function getTypeInput(obj) {
  return new Select({
    name: 'type',
    value: obj.type,
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

function getWhdSelect(label) {
  return new Select({
    label,
    name: 'xyz',
    list: {'0': 'W', '1': 'H', '2':'D'},
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
  return {typeInput:  getTypeInput(obj),
          centerXyzSelect: getXyzSelect('Center'),
          demensionXyzSelect: getWhdSelect('Demension'),
          rotationXyzSelect: getXyzSelect('Rotation'),
          getEqn, obj
        };
}

const getLocationOpeningState = () => ({
    innerOouter: true,
    topObottom: true,
    leftOright: true,
    xOyOz: 'x'
  });

function getOpening(obj) {
  obj.locationState ||= getLocationOpeningState();
  return {obj, select: getOpeningLocationSelect(), state: obj.locationState};
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

const getObjects = {
    subassemblies: () => (      {
      type: "Panel",
      center: [0,0,0],
      demensions: [1,1,1],
      rotation: [0,0,0],
      include: 'All'
    })
}

function updateTemplateDisplay() {
  const managerElems = du.find.all('[template-manager]');
  for (let index = 0; index < managerElems.length; index += 1) {
    const templateManagerId = managerElems[index].getAttribute('template-manager');
    const templateManager =TemplateManager.get(templateManagerId);
    templateManager.update();
  }
}


function addExpandable(template, type) {
  const containerClass = containerClasses[type];
  let parentSelector = `[template-id='${template.id()}']>.${containerClass}`;
  TemplateManager.headTemplate[type] ||= new $t(`managers/template/${type.toKebab()}/head`);
  TemplateManager.bodyTemplate[type] = TemplateManager.bodyTemplate[type] === undefined ?
                    new $t(`managers/template/${type.toKebab()}/body`) : TemplateManager.bodyTemplate[type];
  let getHeader = (obj) => TemplateManager.headTemplate[type].render(getScope(type, obj));
  let getBody = TemplateManager.bodyTemplate[type] ? ((obj) => TemplateManager.bodyTemplate[type].render(getScope(type, obj))) : undefined;
  const expListProps = {
    idAttribute: 'name',
    list: template[type](),
    getObject: getObjects[type],
    renderBodyOnOpen: false,
    parentSelector, getHeader, getBody,
    listElemLable: type.toSentance(),
  };
  const expandList = new ExpandableList(expListProps);
  expandList.afterRemoval(updateTemplateDisplay);
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
    const templateShapeInput = (template) => TemplateManager.templateShapeInput(template.shape());
    const dividerJointInput = (template) =>
      getJointInputTree(dividerJointChange(template), template.dividerJoint(), true).payload();

    const containerSelector = (template, containerClass) => `[template-id="${template.id()}"]>.${containerClass}`;

    const getHeader = (template) =>
      TemplateManager.headTemplate.render({template, TemplateManager: this});
    const getBody = (template) => {
      currentTemplate = template;
      setTimeout(() => {
        updateExpandables(template);
      }, 100);
      setTimeout(() => {
        validateOpenTemplate(du.id(parentId));
      }, 1000);
      return TemplateManager.bodyTemplate.render({template, TemplateManager: this,
        containerClasses, dividerJointInput: dividerJointInput(template), toDisplay,
        templateShapeInput: templateShapeInput(template)});
      }

    const expandables = {};
    function initTemplate(template) {
      const list = [];
      expandables[template.id()] = list;
      return () => {
        list.push(addExpandable(template, 'values'));
        list.push(addExpandable(template, 'subassemblies'));
        list.push(addExpandable(template, 'joints'));
        list.push(addExpandable(template, 'openings', true));
      };
    }

    function updateExpandables(template) {
      template ||= currentTemplate;
      if (template === undefined) return;
      if (!expandables[template.id()]) initTemplate(template)();
      expandables[template.id()].forEach((e) => e.refresh());
    }
    this.updateExpandables = updateExpandables;

    const getObject = (values) => {
      const cabTemp = new CabinetTemplate(values.name);
      initTemplate(cabTemp)();
      return cabTemp;
    }

    this.active = () => expandList.active();
    const expListProps = {
      list: CabinetTemplate.defaultList(),
      inputTree: TemplateManager.inputTree(),
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Template',
      type: 'sidebar'
    };
    setTimeout(initTemplate(expListProps.list[0]), 200);
    const expandList = new ExpandableList(expListProps);

    this.update = () => {
      expandList.refresh();
    }
    this.loadPoint = () => console.log('load');
    this.savePoint = () => console.log('save');
    this.fromJson = () => {};
    const html = TemplateManager.mainTemplate.render(this);
    du.find(`#${id}`).innerHTML = html;
  }
}

const radioDisplay = new RadioDisplay('cabinet-template-input-cnt', 'template-id');

TemplateManager.inputTree = () => {
  const dit = new DecisionInputTree();
  dit.leaf('Template Name', [Inputs('name')]);
  return dit;
}

TemplateManager.templateShapeInput = (value) => {
  return new Select({
      name: 'templateShape',
      list: Object.keys(Snap2d.get),
      class: 'template-shape-input',
      value: value
    });
};

radioDisplay.afterSwitch((elem, detail) => {
  const newState = detail.targetHeader.innerText === 'Openings';
  const updateModel = newState !== modifyingOpening;
  modifyingOpening = newState;
  updateModel && validateOpenTemplate(detail.targetHeader);
});

TemplateManager.mainTemplate = new $t('managers/template/main');
TemplateManager.headTemplate = new $t('managers/template/head');
TemplateManager.bodyTemplate = new $t('managers/template/body');
TemplateManager.bodyTemplate.values = false;
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
}

function switchEqn(elem) {
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

function updateViewShape(elem) {
  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
  const template = CabinetTemplate.get(templateId);
  template.shape(elem.value);
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

function updateInclude(elem) {
  const subAssem = ExpandableList.get(elem);;
  subAssem.include = elem.value;
  console.log(subAssem);
}

du.on.match('change', '.template-include', updateInclude);
du.on.match('change', '.opening-part-code-input', updateOpeningsTemplate);
du.on.match('change', '.template-shape-input', updateViewShape);
du.on.match('change', '[name="xyz"]', switchEqn);
du.on.match('change', '[name="openingLocation"]', updateOpeningPartCode);
du.on.match('change', '.template-input[name="malePartCode"],.template-input[name="femalePartCode"]', updateJointPartCode);
du.on.match('click', '.copy-template', (elem) => {
  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
  const template = CabinetTemplate.get(templateId);
  let jsonStr = JSON.stringify(template.toJson(), null, 2);
  jsonStr = jsonStr.replace(/.*"id":.*($|,)/g, '');
  du.copy(jsonStr);
});

du.on.match('click', '.paste-template', (elem) => {
  navigator.clipboard.readText()
  .then(text => {
    try {
      const obj = Object.fromJson(JSON.parse(text));
      if (!(obj instanceof CabinetTemplate)) throw new Error(`Json is of type ${obj.constructor.name}`);
      const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
      const template = CabinetTemplate.get(templateId);
      template.fromJson(obj.toJson());
      const templateManagerId = du.find.up('[template-manager]', elem).getAttribute('template-manager');
      const templateManager =TemplateManager.get(templateManagerId);
      templateManager.update();
    } catch (e) {
      alert('clipboard does not contain a valid CabinetTemplate');
    }
  })
  .catch(err => {
    console.error('Failed to read clipboard contents: ', err);
  });
});

du.on.match('change', '.template-input', function (elem) {
  const templateId = du.find.up('[template-id]', elem).getAttribute('template-id');
  template = CabinetTemplate.get(templateId);
  updateTemplate(elem, template);
});

du.on.match('change', 'input,select',   () => setTimeout(validateOpenTemplate, 0));


module.exports = TemplateManager
