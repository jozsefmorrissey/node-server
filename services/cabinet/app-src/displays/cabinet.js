


const Show = require('../show.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const ThreeDMain = require('../displays/three-d-main.js');
// const ThreeDModel = require('../three-d/three-d-model.js');
const TwoDLayout = require('../displays/two-d-layout');
const OpenSectionDisplay = require('./open-section.js');
const CabinetConfig = require('../config/cabinet-configs.js');
const ExpandableList = require('../../../../public/js/utils/lists/expandable-list.js');
const Measurement = require('../../../../public/js/utils/measurement.js');
const Request = require('../../../../public/js/utils/request.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const $t = require('../../../../public/js/utils/$t.js');
const EPNTS = require('../../generated/EPNTS');
const Global = require('../services/global');
const Canvas = require('canvas');
const FileTabDisplay = require('../../../../public/js/utils/lists/file-tab.js');
const VoidDisplay = require('./advanced/subassemblies/void.js');
const ObjectInputTree = require('../input/object-input-tree');
const SimpleModel = require('../objects/simple/simple.js');
const CabinetAdvanced = require('./advanced/cabinet');

// function getHtmlElemCabinet (elem) {
//   const cabinetId = du.find.up('[cabinet-id]', elem).getAttribute('cabinet-id');
//   return Cabinet.get(cabinetId);
// }


const openingHtml = () => {
  const cabinet = Global.cabinet();
  const openings = cabinet.openings;
  let html = '';
  for (let i = 0; i < openings.length; i++) {
    html += `  <div class='divison-section-cnt' index='${i}'>
    ${OpenSectionDisplay.html(openings[i].sectionProperties())}</div:t>`
  }
  return html
}

const advancedMenu = () => {
  return CabinetAdvanced(Global.cabinet());
}

const voidDisplay = new VoidDisplay(Global.cabinet);
const fileTabDisp = new FileTabDisplay();
fileTabDisp.register('Advanced', advancedMenu);
fileTabDisp.register('Layout', openingHtml);
fileTabDisp.register('Voids', voidDisplay.html, (contentCnt) => {
  const voidCnt = du.find.down('[void-disp-hash]');
  return (voidCnt && voidCnt.getAttribute('void-disp-hash') === voidDisplay.hash() + '') === true
});


voidDisplay.on.change(fileTabDisp.update);

class CabinetDisplay {
  constructor(parentSelector, group) {
    let propId = 'Half Overlay';
    let displayId = String.random();
    const instance = this;
    this.propId = (id) => {
      if (id ===  undefined) return propId;
      propId = id;
    }
    function displayValue(val) {
      return new Measurement(val).display();
    }
    const getHeader = (cabinet, $index) => {
      return CabinetDisplay.headTemplate.render({cabinet, $index, displayValue, displayId});
    }
    const showTypes = Show.listTypes();
    const display = (value) => new Measurement(value).display();
    const getBody = (cabinet, $index) => {
      Global.cabinet(cabinet);
      if (expandList.activeKey() === $index) Canvas.render();
      if (cabinet instanceof SimpleModel) {
        return CabinetDisplay.simpleBodyTemplate.render({});
      } else {
        const valueObj = cabinet.value.values;
        const keys = Object.keys(valueObj);
        const modifiableValues = cabinet.modifiableValues();
        const scope = {$index, cabinet, showTypes, OpenSectionDisplay,
          modifiableValues, display, fileTabDisp};
        return CabinetDisplay.bodyTemplate.render(scope);
      }
    }

    function inputValidation(values) {
      // const validName = values.name !== undefined;
      // const validType = CabinetConfig.valid(values.type, values.id);
      if(true) return true;
      return {type: 'You must select a defined type.'};
    }

    // async function update3Dmodel(target) {
    //   const cabinet = Global.cabinet();
    //   target.value = new Measurement(target.value, true).display();
    //   await ThreeDModel.build(cabinet);
    //   Canvas.render();
    // }
    //
    // du.on.match('enter', '.cabinet-cnt .expandable-list-body', update3Dmodel);

    function updateCabValue(cabinet, attr) {
      const inputCnt = du.find(`[cabinet-id='${cabinet.id()}']`);
      const input = du.find.down(`[name='${attr}']`, inputCnt);
      input.value = displayValue(cabinet[attr]());
    }

    function removeFromLayout(elem, cabinet) {
      group.room().layout().removeByPayload(cabinet);
      TwoDLayout.panZoom.once();
    }

    function linkLayout(cabinet, obj3D) {
      const snap = obj3D.snap.top();
      if (snap.width() !== cabinet.width()) {
        cabinet.width(snap.width());
        updateCabValue(cabinet, 'width');
      }
      if (snap.height() !== cabinet.thickness()) {
        cabinet.thickness(snap.height());
        updateCabValue(cabinet, 'thickness');
      }
    }

    const getObject = (values) => {
      if (values.objectType === 'Cabinet') {
        values = values.CabinetNode;
        const cabinet = CabinetConfig.get(group, values.type, values.layout, values.name);
        Global.target(cabinet);
        Canvas.render();
        return cabinet;
      } else {
        values = values.OtherNode;
        const sm = SimpleModel.get(values.simpleType);
        Global.target(sm);
        Canvas.render();
        return sm;
      }
    };
    this.active = () => expandList.active();
    const expListProps = {
      list: group.objects,
      // dontOpenOnAdd: true,
      type: 'top-add-list',
      inputTree:   ObjectInputTree(),
      parentSelector, getHeader, getBody, getObject, inputValidation,
      listElemLable: 'Object'
    };
    const expandList = new ExpandableList(expListProps);
    expandList.afterRemoval(removeFromLayout);
    this.refresh = () => expandList.refresh();

    this.html = expandList.html;

    const cabinetKey = (path) => {
      const split = path.split('.');
      const index = split[0];
      const key = split[1];
      const cabinet = expListProps.list[index];
      return {cabinet, key};
    }

    // const valueUpdate = (path, value) => {
    //   const cabKey = cabinetKey(path);
    //   const decimal = new Measurement(value, true).decimal();
    //   cabKey.cabinet.value(cabKey.key, !Number.isNaN(decimal) ? decimal : value);
    //   TwoDLayout.panZoom.once();
    //   ThreeDMain.update(cabKey.cabinet);
    // }

    const attrUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      const decimal = new Measurement(value, true).decimal();
      if (!Number.isNaN(decimal)) {
        if (cabKey.cabinet[cabKey.key]() !== decimal) {
          cabKey.cabinet[cabKey.key](decimal);
          const parentCnt = du.find(parentSelector);
          // ExpandableList.refresh(du.find.down('.expandable-list', parentCnt), true);
        }
      } if (path.match('[0-9]{1,}\.name')) {
        cabKey.cabinet[cabKey.key](value);
        TwoDLayout.panZoom.once();
      }
    }

    const saveSuccess = () => console.log('success');
    const saveFail = () => console.log('failure');
    const save = (target) => {
      const index = target.getAttribute('index');
      const cabinet = expListProps.list[index];
      if (cabinet.name !== undefined) {
        Request.post(EPNTS.cabinet.add(cabinet.name()), cabinet.toJson(), saveSuccess, saveFail);
        console.log('saving');
      } else {
        alert('Please enter a name if you want to save the cabinet.')
      }
    }

    function updateValue(elem) {
      const cabinet = ExpandableList.get(elem);
      const key = elem.previousElementSibling.innerText;
      const evaluated = cabinet.eval(elem.value);
      const value = "" + new Measurement(evaluated, true).decimal();
      cabinet.value(key, value);
    }

    // WTFs
    // CabinetConfig.onUpdate(() => props.inputOptions = CabinetConfig.list());
    // bind(`.cabinet-input`, valueUpdate,
    //               {validation: Measurement.validation('(0,)')});
    bind(`[display-id="${displayId}"].cabinet-id-input`, attrUpdate);
    du.on.match('click', '.save-cabinet-btn', save);
    du.on.match('focusout', '.modifiable-value-input', updateValue);

    du.on.match('change', '.show-select', (elem) => {
      const side = elem.getAttribute('side');
      const type = du.find.closest('.show-select[name="type"]', elem).value;
      const endStyle = du.find.closest('.show-select[name="endStyle"]', elem).value;
      Global.cabinet().value('show' + side, {type, endStyle});
      Global.cabinet().hash();

      console.log(Global.cabinet().hash());
    });
  }
}

CabinetDisplay.simpleBodyTemplate = new $t('cabinet/simple');
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');
module.exports = CabinetDisplay
