


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
const Divider = require('../objects/assembly/assemblies/divider.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const Features = require('./advanced/features');

const SectionDisplay = {};
// class SectionDisplay {
//   constructor (section) {
//     this.render = (scope) => {
//       scope.featureDisplay = new FeatureDisplay(scope.opening).html();
//       const cId = scope.opening.constructor.name;
//       if (cId === 'SectionProperties') {
//         return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
//       }
//       return SectionDisplay.template(section).render(scope);
//     }
//   }
// }

SectionDisplay.formatCoverName = (name) => {
  return name.replace(/(.*)Section$/, '$1').toSentance();
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
  return templates[templatePath].render({section, Features});
}

// du.on.match('change', '.feature-radio', (target) => {
//   const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
//   allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
//   target.nextElementSibling.hidden = !target.checked;
// });

// displays = {};
// SectionDisplay.render = (scope) => {
//   const uId = scope.opening.id();
//   if (displays[uId] === undefined) displays[uId] = new SectionDisplay(scope.opening);
//   return displays[uId].render(scope);
// }

const OpenSectionDisplay = {};

OpenSectionDisplay.html = (opening) => {
  const openDispId = OpenSectionDisplay.getId(opening);
  OpenSectionDisplay.sections[opening.id()] = opening;
  if (opening.sectionCount() > 1) OpenSectionDisplay.refresh(opening, true);
  const patternInputHtml = OpenSectionDisplay.patterInputHtml(opening);
  const sections = SectionProperties.list();
  const featuresHtml = SectionDisplay.template(opening.cover());
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
    const assemblies = opening.getSubassemblies();
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
    value: opening.divider().divider().type(),
    inline: true
  });
  return OpenSectionDisplay.dividerControlTemplate.render({opening, patternInputHtml, dividerTypeSelect});
}

du.on.match('change', '.divider-type-selector', (elem) => {
  const obj = ExpandableList.get(elem);
  obj.divider().divider().type(elem.value);
});

OpenSectionDisplay.updateDividers = (opening) => {
  const focusInfo = du.focusInfo();
  const selector = `[opening-id="${opening.id()}"].opening-cnt > .divider-controls`;
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
        OpenSectionDisplay.getList(opening).refresh(type);
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
    measInput.on('enter', (value, target) => {
      opening.pattern().value(target.name, Measurement.decimal(target.value));
      fill = opening.dividerLayout().fill;
      const patternCnt = document.querySelector(patCntSelector);
      const inputs = patternCnt.querySelectorAll('input');
      fill.forEach((value, index) => {
        if (inputs[index] !== target)
          inputs[index].value = value;
      });

    });
    inputHtml += measInput.html();
    measInput.on('change', (value, target) => {
      const dec = new Measurement(value, true).decimal();
      if (!Number.isNaN(dec)) {
        const oldValue = opening.pattern().value(target.name);
        opening.pattern().value(target.name, dec);
      }
    })
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
  const openId = target.getAttribute('open-id');
  const value = target.value;
  const opening = OpenSectionDisplay.sections[openId];
  opening.vertical(value === 'vertical');
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
  if (targetCnt) {
    targetCnt.innerText = SectionDisplay.formatCoverName(target.value || 'Open');
  }
}

du.on.match('keyup', '.division-pattern-input', OpenSectionDisplay.onPatternChange);
du.on.match('change', '.division-pattern-input', expiditeRefresh);
du.on.match('click', '.open-orientation-radio', OpenSectionDisplay.onOrientation);
du.on.match('change', '.section-selection', OpenSectionDisplay.onSectionChange)
module.exports = OpenSectionDisplay
