


const SectionProperties = require('../objects/assembly/assemblies/section/section-properties.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const ExpandableList = require('../../../../public/js/utils/lists/expandable-list.js');
const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
const ThreeDMain = require('./three-d-main.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const Measurement = require('../../../../public/js/utils/measurement.js');
const $t = require('../../../../public/js/utils/$t.js');
const FeatureDisplay = require('./feature');
const Inputs = require('../input/inputs.js');


class SectionDisplay {
  constructor (section) {
    this.render = (scope) => {
      scope.featureDisplay = new FeatureDisplay(scope.opening).html();
      const cId = scope.opening.constructor.name;
      if (cId === 'SectionProperties') {
        return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
      }
      return SectionDisplay.template(section).render(scope);
    }
  }
}

const templates = {};
const fileLocations = {};
SectionDisplay.template = (section) => {
  const cName = section.constructor.name;
  if (fileLocations[cName] === undefined) {
    const filename = cName.replace(/Section$/, '')
                            .replace(/([a-z])([A-Z])/g, '$1-$2')
                            .toLowerCase();
    fileLocations[cName] = `sections/${filename}`;
  }
  const templatePath = fileLocations[cName];
  if (templates[templatePath] === undefined) templates[templatePath] = new $t(templatePath);
  return templates[templatePath];
}

du.on.match('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
});

displays = {};
SectionDisplay.render = (scope) => {
  const uId = scope.opening.id();
  if (displays[uId] === undefined) displays[uId] = new SectionDisplay(scope.opening);
  return displays[uId].render(scope);
}

const OpenSectionDisplay = {};

OpenSectionDisplay.html = (opening) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  opening.init();
  OpenSectionDisplay.sections[opening.id()] = opening;
  setTimeout(() => OpenSectionDisplay.refresh(opening), 100);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  return OpenSectionDisplay.template.render({opening, openDispId, patternInputHtml});
}

OpenSectionDisplay.getSelectId = (opening) => `opin-division-pattern-select-${opening.id()}`;
OpenSectionDisplay.template = new $t('opening');
OpenSectionDisplay.listBodyTemplate = new $t('divide/body');
OpenSectionDisplay.listHeadTemplate = new $t('divide/head');
OpenSectionDisplay.sections = {};
OpenSectionDisplay.lists = {};
OpenSectionDisplay.getId = (opening) => `open-section-display-${opening.id()}`;

OpenSectionDisplay.getList = (root) => {
  let openId = root.id();
  if (OpenSectionDisplay.lists[openId]) return OpenSectionDisplay.lists[openId];
  const sections = SectionProperties.sections();
  const getObject = (target) => sections[Math.floor(Math.random()*sections.length)];
  const parentSelector = `#${OpenSectionDisplay.getId(root)}`
  const list = root.sections;
  const hideAddBtn = true;
  const selfCloseTab = true;
  let exList;
  const clean = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
  const getHeader = (opening, index) => {
    const sections = SectionProperties.sections();
    return OpenSectionDisplay.listHeadTemplate.render({opening, sections, clean});
  }
  const getBody = (opening) => {
    const list = OpenSectionDisplay.getList(root);
    const getFeatureDisplay = (assem) => new FeatureDisplay(assem).html();
    const assemblies = opening.getSubassemblies();
    return SectionDisplay.render({assemblies, getFeatureDisplay, opening, list, sections});
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
  const selector = `[opening-id="${opening.id()}"].opening-cnt > .divider-controls`;
  const dividerControlsCnt = document.querySelector(selector);
  const selectPatternId = OpenSectionDisplay.getSelectId(opening);
  bind(`#${selectPatternId}`, (g, p) => opening.pattern(p), /.*/);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  dividerControlsCnt.innerHTML = OpenSectionDisplay.dividerControlTemplate.render(
          {opening, selectPatternId, patternInputHtml});
}

OpenSectionDisplay.changeIds = {};
OpenSectionDisplay.refresh = (opening) => {
  let changeId = (OpenSectionDisplay.changeIds[opening.id()] || 0) + 1;
  OpenSectionDisplay.changeIds[opening.id()] = changeId;
  setTimeout(()=> {
    if (changeId === OpenSectionDisplay.changeIds[opening.id()]) {
      const id = OpenSectionDisplay.getId(opening);
      const target = du.id(id);
      const listCnt = du.find.up('.expandable-list', target);
      if (!listCnt) return;
      const listId = Number.parseInt(listCnt.getAttribute('ex-list-id'));

      const type = opening.isVertical() === true ? 'pill' : 'sidebar';
      OpenSectionDisplay.updateDividers(opening);
      OpenSectionDisplay.getList(opening).refresh(type);
      const dividerSelector = `[opening-id='${opening.id()}'].division-count-input`;
      // listCnt.querySelector(dividerSelector).focus();
    }
  }, 500);
}

OpenSectionDisplay.patternContainerSelector = (opening) =>
  `.open-pattern-input-cnt[opening-id='${opening.id()}']`;

OpenSectionDisplay.lastInputValues = {};
OpenSectionDisplay.patterInputHtml = (opening) => {
  const pattern = opening.pattern();
  const patCntSelector = OpenSectionDisplay.patternContainerSelector(opening);

  let inputHtml = '';
  const unique = pattern.unique();
  for (let index = 0; index < unique.length; index += 1) {
    const id = unique[index];
    let fill = opening.dividerLayout().fill;
    const measInput = Inputs('pattern', {
      label: id,
      placeholder: id,
      name: id,
      value: fill[index]
    });
    measInput.on('keyup', (value, target) => {
      opening.pattern().value(target.name, Measurement.decimal(target.value));
      fill = opening.dividerLayout().fill;
      const patternCnt = document.querySelector(patCntSelector);
      const inputs = patternCnt.querySelectorAll('input');
      fill.forEach((value, index) => {
        if (inputs[index] !== target)
          inputs[index].value = value;
      });
      if (opening.pattern().satisfied()) {
        const cabinet = opening.getAssembly('c');
        ThreeDMain.update(cabinet);
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

OpenSectionDisplay.patternInputSelector = (opening) =>
  `[name='pattern'][opening-id='${opening.id()}']`;

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
    ThreeDMain.update(cabinet);
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
  const index = ExpandableList.getIdAndKey(target).key;
  section.parentAssembly().setSection(target.value, index);
  OpenSectionDisplay.refresh(section.parentAssembly());
  ThreeDMain.update(section);
}

du.on.match('keyup', '.division-pattern-input', OpenSectionDisplay.onPatternChange);
du.on.match('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
du.on.match('change', '.open-divider-select', OpenSectionDisplay.onSectionChange)
module.exports = OpenSectionDisplay
