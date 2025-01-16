


const SectionProperties = require('../objects/assembly/assemblies/section/section-properties.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const ExpandableList = require('../../../../public/js/utils/lists/expandable-list.js');
const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
const ThreeDMain = require('./three-d-main.js');
const StringMathEvaluator = require('../../../../public/js/utils/string-math-evaluator.js');
const $t = require('../../../../public/js/utils/$t.js');
const FeatureDisplay = require('./feature');
const Inputs = require('../input/inputs.js');
const Divider = require('../objects/assembly/assemblies/divider.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Features = require('./advanced/features');

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

SectionDisplay.formatCoverName = (name) => {
  return name.replace(/(.*)Section$/, '$1').toSentance();
}

const templates = {};
const fileLocations = {};
SectionDisplay.template = (section) => {
  const cName = section instanceof SectionProperties ? 'open' : section.constructor.name;
  if (fileLocations[cName] === undefined) {
    const filename = cName.replace(/Section$/, '')
                            .replace(/([a-z])([A-Z])/g, '$1-$2')
                            .toLowerCase();
    fileLocations[cName] = `sections/${filename}`;
  }
  const templatePath = fileLocations[cName];
  if (templates[templatePath] === undefined) templates[templatePath] = new $t(templatePath);
  return templates[templatePath].render({section, Features});
}

du.on.match('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
});

displays = {};
SectionDisplay.render = (scope) => {
  if (scope.opening === undefined) return '';
  const uId = scope.opening.id();
  if (displays[uId] === undefined) displays[uId] = new SectionDisplay(scope.opening);
  return displays[uId].render(scope);
}

const OpenSectionDisplay = {};

OpenSectionDisplay.featuresHtml = (openingOelem) => {
  if (openingOelem instanceof HTMLElement) {
    const id = du.find.up('[opening-id]', openingOelem).getAttribute("opening-id");
    openingOelem = Lookup.get(id);
  }
  return SectionDisplay.template(openingOelem.cover() || openingOelem);
}

OpenSectionDisplay.html = (opening) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  OpenSectionDisplay.sections[opening.id()] = opening;
  if (opening.sectionCount() > 1) OpenSectionDisplay.refresh(opening, true);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  const sections = SectionProperties.list();
  const featuresHtml = OpenSectionDisplay.featuresHtml(opening);
  return OpenSectionDisplay.template.render({opening, openDispId, patternInputHtml, Features,
                                            sections, OpenSectionDisplay, featuresHtml});
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
  // const sections = SectionProperties.sections();
  // const getObject = (target) => sections[Math.floor(Math.random()*sections.length)];
  const parentSelector = `#${OpenSectionDisplay.getId(root)}`
  const list = root.sections;
  const hideAddBtn = true;
  const selfCloseTab = true;
  let exList;
  const clean = (name) => name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
  const getHeader = (opening, index) => {
    const cover = opening.cover()
    const headText =  SectionDisplay.formatCoverName(cover ? cover.constructor.name : 'Open');
    return OpenSectionDisplay.listHeadTemplate.render({opening, clean, headText});
  }
  const getBody = (opening) => {
    const list = OpenSectionDisplay.getList(root);
    const getFeatureDisplay = (assem) => new FeatureDisplay(assem).html();
    const assemblies = opening === undefined ? [] : opening.getSubassemblies();
    return SectionDisplay.render({assemblies, getFeatureDisplay, opening, list});
  }
  const findElement = (selector, target) => du.find.down(selector, du.find.up('.expandable-list', target));
  const expListProps = {
    parentSelector, getHeader, getBody, list, hideAddBtn,
    selfCloseTab, findElement, startClosed: true, removeButton: false, hideAddBtn: true
  }
  exList = new ExpandableList(expListProps);
  OpenSectionDisplay.lists[openId] = exList;
  return exList;
}
OpenSectionDisplay.dividerControlTemplate = new $t('divider-controls');
OpenSectionDisplay.dividerHtml = (opening) => {
  const selector = `[opening-id="${opening.id()}"].opening-cnt > .divider-controls`;
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  const dividerTypeSelect = new Select({
    label: 'Type',
    name: 'dividerType',
    list: Divider.Types,
    class: 'divider-type-selector',
    value: opening.divider().type(),
    inline: true
  });
  return OpenSectionDisplay.dividerControlTemplate.render({opening, patternInputHtml, dividerTypeSelect});
}

du.on.match('change', '.divider-type-selector', (elem) => {
  const obj = ExpandableList.get(elem);
  obj.divider().type(elem.value);
});

OpenSectionDisplay.updateDividers = (opening) => {
  const focusInfo = du.focusInfo();
  const selector = `[opening-id="${opening.id()}"].opening-cnt > .divider-controls > div`;
  const dividerControlsCnt = document.querySelector(selector);
  dividerControlsCnt.innerHTML = OpenSectionDisplay.dividerHtml(opening);
  du.focus(focusInfo);
  console.log();
}

OpenSectionDisplay.changeIds = {};
OpenSectionDisplay.refresh = (opening, rapid, onlyIfPending) => {
  if (OpenSectionDisplay.changeIds[opening.id()] === undefined)
    OpenSectionDisplay.changeIds[opening.id()] = {nextId: 0, lastId: 0};
  let idObj = OpenSectionDisplay.changeIds[opening.id()];
  let changeId = idObj.nextId;
  if (!onlyIfPending || changeId > idObj.lastId) {
    idObj.nextId = ++changeId;
    setTimeout(()=> {
      if (changeId === idObj.nextId) {
        idObj.lastId = changeId;
        const id = OpenSectionDisplay.getId(opening);
        const target = du.id(id);
        const listCnt = du.find.up('.expandable-list', target);
        if (!listCnt) return;
        const listId = Number.parseInt(listCnt.getAttribute('ex-list-id'));

        const type = opening.isVertical() === true ? 'pill' : 'sidebar';
        OpenSectionDisplay.updateDividers(opening);
        if (opening.sectionCount() > 1) OpenSectionDisplay.getList(opening).refresh(type);
        const dividerSelector = `[opening-id='${opening.id()}'].division-count-input`;
        // listCnt.querySelector(dividerSelector).focus();
      }
    }, 50);
  }
}

OpenSectionDisplay.patternContainerSelector = (opening) =>
  `.open-pattern-input-cnt[opening-id='${opening.id()}']`;

OpenSectionDisplay.lastInputValues = {};
OpenSectionDisplay.patterInputHtml = (opening) => {
  const pattern = opening.pattern();
  const unique = pattern.unique();
  if (unique.length === 1) return '';
  const patCntSelector = OpenSectionDisplay.patternContainerSelector(opening);
  let inputHtml = '';
  let isDisconnected = false;
  for (let index = 0; index < unique.length; index += 1) {
    const id = unique[index];
    let fill = opening.dividerLayout().fill;
    const dis = pattern.elements[id].disconnected() ? ' disconnected' : '';
    isDisconnected ||= !!dis;
    const measInput = Inputs('pattern', {
      label: id,
      placeholder: id,
      class: `pattern-input${dis}`,
      disabled: pattern.isRatio(),
      name: id,
      value: fill[id]
    });
    measInput.on('enter:change', (value, target) => {
      opening.pattern().value(target.name, Measurement.decimal(target.value, true));
      fill = opening.dividerLayout().fill;
      const patternCnt = document.querySelector(patCntSelector);
      const inputs = patternCnt.querySelectorAll('input');
      let isDisconnected = false;
      inputs.forEach((elem, i) => {
        if (i !== inputs.length - 1) {
          const disconnected = pattern.elements[elem.name].disconnected();
          isDisconnected ||= disconnected;
          du.class.oft(elem, 'disconnected', disconnected);
        }
        if (elem !== target)
          elem.value = fill[elem.name];
      });
      du.class.oft(du.find.closest('.disconnected-cnt', target), 'hidden', !isDisconnected);
    });
    inputHtml += measInput.html();
  }
  inputHtml += `<div class='disconnected-cnt${isDisconnected ? '' : ' hidden'}'>
<div class='globe-cnt'><i class='gg-globe'></i></div>
<button class='remove-btn'>X</button>
</div`;
  return inputHtml;
};

du.on.match('click', '.divider-controls .remove-btn', (elem) => {
  const opening = OpenSectionDisplay.getOpening(elem);
  opening.pattern().values.reset();
  OpenSectionDisplay.updateDividers(opening);
});

du.on.match('click', '.divider-controls .globe-cnt', (elem) => {
  const opening = OpenSectionDisplay.getOpening(elem);
  const pattern = opening.pattern();
  const values = pattern.values();
  const group = opening.getRoot().group();
  Object.keys(values).forEach(k => group.propertyConfig(`pattern_${k}`, values[k]));
  opening.pattern().values.reset();
  OpenSectionDisplay.updateDividers(opening);
});

OpenSectionDisplay.getOpening = (target) => {
  const openElem = du.find.up('[opening-id]', target);
  const openId = openElem.getAttribute('opening-id');
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
    if (newVal.length < 2) du.id(OpenSectionDisplay.getId(opening)).innerHTML = '';
    else OpenSectionDisplay.refresh(opening);
    const cabinet = opening.getAssembly('c');
  }
  if (inputCnt !== null) {
    inputCnt.hidden = opening.pattern().equals;
  }
}

function expiditeRefresh(target) {
  const opening = OpenSectionDisplay.getOpening(target);
  OpenSectionDisplay.refresh(opening, true, true);
}

OpenSectionDisplay.onOrientation = (target) => {
  const opening = OpenSectionDisplay.getOpening(target);
  const isVertical = target.getAttribute('orientation') === 'vertical';
  opening.vertical(isVertical);
  opening.reevaluate();
  OpenSectionDisplay.refresh(opening);
};

OpenSectionDisplay.onSectionChange = (target) => {
  // ExpandableList.value('selected', target.value, target);
  let section = ExpandableList.get(target);
  if (!(section instanceof SectionProperties)) {
    const index = du.find.up('[index]', target).getAttribute('index');
    section = section.openings[index].sectionProperties();
  }
  section.setSection(target.value === "Open" ? null : target.value);
  const expandHeader = ExpandableList.getHeaderCnt(target);
  const targetCnt = du.find.down('.open-divider-select', expandHeader);
  const html = OpenSectionDisplay.featuresHtml(target);
  du.find.closest('.section-feature-cnt .chev-dropdown').innerHTML = html;
  if (targetCnt) {
    targetCnt.innerText = SectionDisplay.formatCoverName(target.value || 'Open');
  }
}

du.on.match('keyup', '.division-pattern-input', OpenSectionDisplay.onPatternChange);
du.on.match('change', '.division-pattern-input', expiditeRefresh);
du.on.match('click', '.div-orien-btn', OpenSectionDisplay.onOrientation);
du.on.match('change', '.section-selection', OpenSectionDisplay.onSectionChange)
module.exports = OpenSectionDisplay
