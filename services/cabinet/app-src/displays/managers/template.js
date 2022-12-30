

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
const ThreeDModel = require('../../three-d/three-d-model.js');
const Layout2D = require('../../objects/layout.js');
const Draw2D = require('../../two-d/draw.js');
const Vertex2d = require('../../two-d/objects/vertex');
const Line2d = require('../../two-d/objects/line');
const Snap2d = require('../../two-d/objects/snap');
const PropertyConfig = require('../../config/property/config.js');
const cabinetBuildConfig = require('../../../public/json/cabinets.json');
const Pattern = require('../../division-patterns.js');
const Handle = require('../../objects/assembly/assemblies/hardware/pull.js');
const OpeningSketch = require('../opening-sketch');
const FaceSketch = require('../face-sketch');
const CSG = require('../../../public/js/3d-modeling/csg.js');
const approximate = require('../../../../../public/js/utils/approximate').new(10);
const PanZoom = require('../../two-d/pan-zoom.js');

let template;
let modifyingOpening = false;
const sectionState = {
  style: 'Overlay',
  vertical: false,
  innerOouter: 'true',
  xOyOz: 'x',
  index: 0,
  count: 0,
};

const openingSketch = new OpeningSketch('opening-sketch-cnt');
const faceSketch = new FaceSketch('front-sketch');
function updateState(elem) {
  const opening = ExpandableList.get(elem);
  sectionState.id = opening.id;
  const attr = elem.name.replace(/(.*?)-.*/, '$1');
  if (attr === 'index') sectionState[attr] = Number.parseInt(elem.value);
  else sectionState[attr] = elem.value;
}

function updateConfig(elem) {
  const value = elem.type === 'checkbox' ? elem.checked : elem.value;
  sectionState[elem.name] = value;
}

du.on.match('keydown', '#template-divider-count-input', (elem,ev) => ev.preventDefault());
du.on.match('change', '.border-location-cnt>input', updateState);
du.on.match('change', '.section-properties>input', updateConfig);

function applyDividers(cabinet) {
  for (let index = 0; index < cabinet.openings.length; index++) {
    const divideCount = Number.parseInt(sectionState.count);
    const opening = cabinet.openings[index];
    opening.vertical(sectionState.vertical);
    opening.divide(divideCount);
    const sectionType = sectionState.sectionType;
    if (sectionType) {
      for (let si = 0; si < opening.sections.length; si++) {
        opening.sections[si].setSection(sectionType);
      }
    }
    const coords = opening.update();
  }
}

function applyTestConfiguration(cabinet) {
  cabinet.width(60*2.54);

  const opening = cabinet.openings[0];
  opening.sectionProperties().pattern('bab').value('a', 30*2.54);
  opening.divide(2);
  const left = opening.sections[0];
  const center = opening.sections[1];
  const right = opening.sections[2];
  const a = 6*2.54

  left.divide(2);
  left.vertical(false);
  left.sections[0].setSection("DrawerSection");
  left.sections[1].setSection("DrawerSection");
  left.sections[2].setSection("DrawerSection");
  left.pattern('abb').value('a', a*2);

  center.divide(1);
  center.vertical(false);
  center.sections[1].setSection('DualDoorSection');
  center.pattern('ab').value('a', a);
  const centerTop = center.sections[0];

  centerTop.divide(2);
  centerTop.sections[0].setSection("DoorSection");
  centerTop.sections[1].setSection("FalseFrontSection");
  centerTop.sections[2].setSection("DoorSection");
  centerTop.pattern('ztz').value('t', 15*2.54);
  centerTop.sections[0].cover().pull().location(Handle.location.RIGHT);
  centerTop.sections[2].cover().pull().location(Handle.location.LEFT);

  right.divide(2);
  right.vertical(false);
  right.sections[0].setSection("DrawerSection");
  right.sections[1].setSection("DrawerSection");
  right.sections[2].setSection("DrawerSection");
  right.pattern('abb').value('a', a);
}

function getDemPosElems () {
  const templateBody = du.find('.template-body');
  return {
    width: du.find.closest('input[name="width"', templateBody),
    height: du.find.closest('input[name="height"', templateBody),
    depth: du.find.closest('input[name="thickness"', templateBody),
  };
}

FunctionCache.disable();
function getCabinet(elem) {
  const templateBody = du.find('.template-body');
  const template = CabinetTemplate.get(templateBody.getAttribute('template-id'), templateBody);
  const dPElems = getDemPosElems();
  const width = new Measurement(dPElems.width.value, true).decimal();
  const height = new Measurement(dPElems.height.value, true).decimal();
  const thickness = new Measurement(dPElems.depth.value, true).decimal();
  const cabinet = template.getCabinet(height, width, thickness);
  cabinet.propertyConfig().set(sectionState.style);

  if (sectionState.testDividers) applyTestConfiguration(cabinet);
  else applyDividers(cabinet);
  openingSketch.cabinet(cabinet);
  console.log(`Cabinet Demesions: ${cabinet.width()} !== ${cabinet.eval('c.w')} x ${cabinet.length()} x ${cabinet.thickness()}`)
  return cabinet;
}

const toDisplay = (value) =>  new Measurement(value).display();
const centerDisplay = (t) => {
  const x = t.getCabinet().eval(t.x());
  const y = t.getCabinet().eval(t.y());
  const z = t.getCabinet().eval(t.z());
  return `(${toDisplay(x)},${toDisplay(y)},${toDisplay(z)})`;
}
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
  if (elem) {
    if (isValid) {
      du.class.remove(elem, 'error');
      elem.setAttribute('error-msg', '');
    } else {
      du.class.add(elem, 'error');
      elem.setAttribute('error-msg', errorMsg);
      setHeaderErrors(elem);
    }
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
  let htmlArr = [];
  for (let index = 0; index < partKeys.length; index += 1) {
    const id = partKeys[index];
    const partCode = partMap[id].code;
    const partName = partMap[id].name;
    htmlArr.push(`<option value='${partName}' part-code='${partCode}'></option>`);
  }
  htmlArr.sort()
  const datalist = du.id('part-list');
  datalist.innerHTML = htmlArr.join('');
}

function vertexToDisplay(vertex) {
  const x = new Measurement(vertex.x).display();
  const y = new Measurement(vertex.y).display();
  const z = new Measurement(vertex.z).display();
  return `(${x}, ${y}, ${z})`;
}

function target(io, i) {
  const targetIndex = i + (io === 'inner' ? 0 : 4);
  return (index) => targetIndex === index;
}

function updateOpenLocationDisplay (opening, elem) {
  const state = sectionState;

  const io = state.innerOouter === 'true' ? 'inner' : 'outer';
  const i = state.index;
  const description = `Current formula describes the ${io} boundry ${state.xOyOz} coordinate of vertex ${state.index}.`;
  du.find.closest('.opening-location-description-cnt', elem).innerText = description;

  const eqnPoint = opening.coordinates && opening.coordinates[io] && opening.coordinates[io][i];

  if (eqnPoint && elem.name !== 'opening-coordinate-value')
    du.find.closest('[name="opening-coordinate-value"]', elem).value = eqnPoint[state.xOyOz];

  const cabinet = getCabinet(elem);
  const coords = cabinet.openings[0].update();


  const html = openingPointTemplate.render({display: vertexToDisplay, coords, target: target(io, i)});
  du.find.closest('.opening-location-value-cnt', elem).innerHTML = html;
}

const openingPointTemplate = new $t('managers/template/openings/points');

function onOpeningLocationChange(elem) {
  const opening = ExpandableList.get(elem);
  // const state = opening.state;
  // let value = elem.value;
  // if (value === 'true') value = true;
  // else if (value === 'false') value = false;
  // const attr = elem.name.replace(/(.*?)-.*/, '$1');
  // state[attr] = value;

  updateOpenLocationDisplay(opening, elem);
}

function onOpeningTypeChange(elem) {
  const opening = ExpandableList.get(elem);
  if (opening._Type !== elem.value) {
    const isLocation = elem.checked;
    const defaultFunc = isLocation ? 'defaultLocationOpening' : 'defaultPartCodeOpening';
    const def = CabinetTemplate[defaultFunc]();
    Object.merge(opening, def, true);
    opening._Type = isLocation ? 'location' : undefined;
    du.find.closest('.border-location-cnt', elem).hidden = !isLocation;
    updateOpeningPartCode(du.find.closest('select', elem));
  }
}

du.on.match('change', '.border-location-cnt>input,.border-location-cnt>span>input', onOpeningLocationChange);
du.on.match('change', '.opening-type-selector', onOpeningTypeChange);

function updateOpeningPoints(template, cabinet) {
  const threeDModel = threeView.threeDModel();
  if (threeDModel) {
    threeDModel.removeAllExtraObjects();
    const openings = cabinet.openings;
    for (let index = 0; index < openings.length; index++) {
      const opening = openings[index];
      const size = modifyingOpening ? 1 : .25;
      const state = sectionState;
      const i = state.index;
      const vertexColor = (io, i) => io !== state.innerOouter ? 'black' :
            (modifyingOpening && i === state.index ? 'lime' : 'white');

      const vertexSize = (io) => modifyingOpening && io === state.innerOouter ? size*2 : size;

      const coords = opening.update();
      threeDModel.addVertex(coords.inner[0], vertexSize('true'), vertexColor('true', '0'));
      threeDModel.addVertex(coords.inner[1], vertexSize('true'), vertexColor('true', '1'));
      threeDModel.addVertex(coords.inner[2], vertexSize('true'), vertexColor('true', '2'));
      threeDModel.addVertex(coords.inner[3], vertexSize('true'), vertexColor('true', '3'));

      threeDModel.addVertex(coords.outer[0], vertexSize('false'), vertexColor('false', '0'));
      threeDModel.addVertex(coords.outer[1], vertexSize('false'), vertexColor('false', '1'));
      threeDModel.addVertex(coords.outer[2], vertexSize('false'), vertexColor('false', '2'));
      threeDModel.addVertex(coords.outer[3], vertexSize('false'), vertexColor('false', '3'));
    }
  }
}

let drawFront, drawTop, lastModel, frontView;
function updateShapeSketches(elem, model) {
  if (drawFront === undefined) {
    const templateBody = du.find('.template-body');
    if (templateBody) {
      const frontCanvas = du.find.down('.front-sketch', templateBody);
      const topCanvas = du.find.down('.top-sketch', templateBody);
      if (frontCanvas !== undefined) {
        drawFront = new Draw2D(frontCanvas);
        panz = new PanZoom(frontCanvas, updateShapeSketches);
        panz.centerOn(0, 0);
        drawTop = new Draw2D(topCanvas);
      }
    }
  }
  if (drawFront === undefined) return;
  if (model) {
    frontView = model.simpleModel.frontView();
    // const center = Vertex2d.center(Line2d.vertices(frontView));
    // const offsetVertex = center.differance(new Vertex2d());
    // const lineVector = new Line2d(new Vertex2d(), offsetVertex);
    // frontView.forEach(l => l.translate(lineVector));
  }
  drawFront(frontView, null, 2);
}

ThreeDModel.onRenderObjectUpdate(updateShapeSketches);

const topView = du.id('three-view-top');
const leftView = du.id('three-view-right');
const frongView = du.id('three-view-front');
function validateOpenTemplate (elem) {
  const templateBody = du.find('.template-body');
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
    const model = threeView.update(cabinet);
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

function getOpening(obj) {
  return {obj, select: getOpeningLocationSelect(), state: sectionState};
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
        containerClasses, centerDisplay, toDisplay,
        dividerJointInput: dividerJointInput(template),
        templateShapeInput: templateShapeInput(template)});
      }

    this.sectionState = sectionState;
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
radioDisplay.afterSwitch(function (header){
  const coordinateInput = du.find.closest('[name="opening-coordinate-value"]', header);
  const opening = ExpandableList.get(coordinateInput);
  if (opening && opening._Type === 'location') {
    const state = opening.state;
    const io = state.innerOouter ? 'inner' : 'outer';
    coordinateInput.value = opening.coordinates[io][state.index][state.xOyOz];
  }

  console.log(opening);
});

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
  const opening = ExpandableList.get(elem);
  const partCodeInput = du.find.closest('input', elem);
  partCodeInput.value = opening[attr] || '';
  updateOpenLocationDisplay(opening, elem);
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
