


const Section = require('../objects/assembly/assemblies/section/section.js');
const FeatureDisplay = require('./feature.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const ExpandableList = require('../../../../public/js/utils/lists/expandable-list.js');
const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
const ThreeDModel = require('../three-d/three-d-model.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const $t = require('../../../../public/js/utils/$t.js');
const Inputs = require('../../input/inputs.js');


const OpenSectionDisplay = {};

OpenSectionDisplay.html = (opening) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  opening.init();
  OpenSectionDisplay.sections[opening.uniqueId] = opening;
  setTimeout(() => OpenSectionDisplay.refresh(opening), 100);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  return OpenSectionDisplay.template.render({opening, openDispId, patternInputHtml});
}

OpenSectionDisplay.getSelectId = (opening) => `opin-division-pattern-select-${opening.uniqueId}`;
OpenSectionDisplay.template = new $t('opening');
OpenSectionDisplay.listBodyTemplate = new $t('divide/body');
OpenSectionDisplay.listHeadTemplate = new $t('divide/head');
OpenSectionDisplay.sections = {};
OpenSectionDisplay.lists = {};
OpenSectionDisplay.getId = (opening) => `open-section-display-${opening.uniqueId}`;

OpenSectionDisplay.getList = (root) => {
  let openId = root.uniqueId;
  if (OpenSectionDisplay.lists[openId]) return OpenSectionDisplay.lists[openId];
  const sections = Section.sections();
  const getObject = (target) => sections[Math.floor(Math.random()*sections.length)];
  const parentSelector = `#${OpenSectionDisplay.getId(root)}`
  const list = root.sections;
  const hideAddBtn = true;
  const selfCloseTab = true;
  let exList;
  const clean = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
  const getHeader = (opening, index) => {
    const sections = index % 2 === 0 ? Section.getSections(false) : [];
    return OpenSectionDisplay.listHeadTemplate.render({opening, sections, clean});
  }
  const getBody = (opening) => {
    const list = OpenSectionDisplay.getList(root);
    const getFeatureDisplay = (assem) => new FeatureDisplay(assem).html();
    const assemblies = opening.getSubAssemblies();
    return Section.render({assemblies, getFeatureDisplay, opening, list, sections});
  }
  const findElement = (selector, target) => du.find.down(selector, du.find.up('.expandable-list', target));
  const expListProps = {
    parentSelector, getHeader, getBody, getObject, list, hideAddBtn,
    selfCloseTab, findElement, startClosed: true
  }
  exList = new ExpandableList(expListProps);
  OpenSectionDisplay.lists[openId] = exList;
  return exList;
}
OpenSectionDisplay.dividerControlTemplate = new $t('divider-controls');
OpenSectionDisplay.updateDividers = (opening) => {
  const selector = `[opening-id="${opening.uniqueId}"].opening-cnt > .divider-controls`;
  const dividerControlsCnt = document.querySelector(selector);
  const selectPatternId = OpenSectionDisplay.getSelectId(opening);
  bind(`#${selectPatternId}`, (g, p) => opening.pattern(p), /.*/);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  dividerControlsCnt.innerHTML = OpenSectionDisplay.dividerControlTemplate.render(
          {opening, selectPatternId, patternInputHtml});
}

OpenSectionDisplay.changeIds = {};
OpenSectionDisplay.refresh = (opening) => {
  let changeId = (OpenSectionDisplay.changeIds[opening.uniqueId] || 0) + 1;
  OpenSectionDisplay.changeIds[opening.uniqueId] = changeId;
  setTimeout(()=> {
    if (changeId === OpenSectionDisplay.changeIds[opening.uniqueId]) {
      const id = OpenSectionDisplay.getId(opening);
      const target = du.id(id);
      const listCnt = du.find.up('.expandable-list', target);
      const listId = Number.parseInt(listCnt.getAttribute('ex-list-id'));

      const type = opening.isVertical() === true ? 'pill' : 'sidebar';
      OpenSectionDisplay.updateDividers(opening);
      OpenSectionDisplay.getList(opening).refresh(type);
      const dividerSelector = `[opening-id='${opening.uniqueId}'].division-count-input`;
      // listCnt.querySelector(dividerSelector).focus();
    }
  }, 500);
}

OpenSectionDisplay.patternContainerSelector = (opening) =>
  `.open-pattern-input-cnt[opening-id='${opening.uniqueId}']`;

OpenSectionDisplay.lastInputValues = {};
OpenSectionDisplay.patterInputHtml = (opening) => {
  const pattern = opening.pattern();
  const patCntSelector = OpenSectionDisplay.patternContainerSelector(opening);

  let inputHtml = '';
  for (let index = 0; index < pattern.unique.length; index += 1) {
    const id = pattern.unique[index];
    let fill = opening.dividerLayout().fill;
    const measInput = Inputs('pattern', {
      label: id,
      placeholder: id,
      name: id,
      value: pattern.value(id)
    });
    measInput.on('keyup', (value, target) => {
      opening.pattern().value(target.name, OpenSectionDisplay.evaluator.eval(target.value));
      fill = opening.dividerLayout().fill;
      const patternCnt = document.querySelector(patCntSelector);
      const inputs = patternCnt.querySelectorAll('input');
      fill.forEach((value, index) => {
        if (inputs[index] !== target)
          inputs[index].value = value;
      });
      if (opening.pattern().satisfied()) {
        const cabinet = opening.getAssembly('c');
        ThreeDModel.render(cabinet);
      }
    });
    inputHtml += measInput.html();
  }
  return inputHtml;
};

OpenSectionDisplay.getOpening = (target) => {
  const openId = target.getAttribute('opening-id');
  return OpenSectionDisplay.sections[openId];
}

OpenSectionDisplay.evaluator = new StringMathEvaluator();
OpenSectionDisplay.patternInputChange = (target) => {
  const opening = OpenSectionDisplay.getOpening(up('.open-pattern-input-cnt', target));
  opening.pattern().value(target.name, OpenSectionDisplay.evaluator(target.value));
  if (opening.pattern().satisfied()) {
    OpenSectionDisplay.refresh(opening);
  }
};

OpenSectionDisplay.patternInputSelector = (opening) =>
  `[name='pattern'][opening-id='${opening.uniqueId}']`;

OpenSectionDisplay.onPatternChange = (target) => {
  const opening = OpenSectionDisplay.getOpening(target);
  const newVal = target.value || 'a';
  const cntSelector = OpenSectionDisplay.patternContainerSelector(opening);
  const inputCnt = document.querySelector(OpenSectionDisplay.patternContainerSelector(opening));
  if (opening.pattern().str !== newVal) {
    opening.pattern(newVal).str;
    const html = OpenSectionDisplay.patterInputHtml(opening);
    document.querySelector(cntSelector).innerHTML = html;
    OpenSectionDisplay.refresh(opening);
    const cabinet = opening.getAssembly('c');
    ThreeDModel.render(cabinet);
  }
  if (inputCnt !== null) {
    inputCnt.hidden = opening.pattern().equal;
  }
}

OpenSectionDisplay.onOrientation = (target) => {
  const openId = target.getAttribute('open-id');
  const value = target.value;
  const opening = OpenSectionDisplay.sections[openId];
  opening.vertical(value === 'vertical');
  OpenSectionDisplay.refresh(opening);
};

OpenSectionDisplay.onSectionChange = (target) => {
  ExpandableList.value('selected', target.value, target);
  const section = ExpandableList.get(target);
  const index = ExpandableList.getIdAndIndex(target).index;
  section.parentAssembly.setSection(target.value, index);
  OpenSectionDisplay.refresh(section.parentAssembly);
  updateModel(section);
}

du.on.match('keyup', '.division-pattern-input', OpenSectionDisplay.onPatternChange);
du.on.match('keyup', '.patternInput', OpenSectionDisplay.patternInputChange);
du.on.match('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
du.on.match('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)
module.exports = OpenSectionDisplay
