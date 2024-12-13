


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
const CabinetNotes = require('./information/cabinet-notes');

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
fileTabDisp.register('Layout', openingHtml);
fileTabDisp.register('Notes', CabinetNotes);
fileTabDisp.register('Parts', advancedMenu);
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
      Global.target(cabinet);
      Canvas.render();
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

    function updateCabValue(cabinet, attr) {
      const inputCnt = du.find(`[cabinet-id='${cabinet.id()}']`);
      const input = du.find.down(`[name='${attr}']`, inputCnt);
      input.value = displayValue(cabinet[attr]());
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
      const nodeName = `${values.objectType}Node`;
      values = values[nodeName];
      if (values.objectType === 'Other') {
        const layout = group.room().layout()
        const sm = SimpleModel.get(values.simpleType, layout);
        sm.bridge.top().center(layout.center())
        Global.target(sm);
        Canvas.render();
        return sm;
      } else {
        const cabinet = CabinetConfig.get(group, values.type, values.layout, values.name);
        Global.target(cabinet);
        Canvas.render();
        return cabinet;
      }
    };
    this.active = () => expandList.active();
    const expListProps = {
      list: group.objects,
      dontOpenOnAdd: true,
      startClosed: true,
      type: 'top-add-list',
      inputTree:   ObjectInputTree(),
      parentSelector, getHeader, getBody, getObject, inputValidation,
      listElemLable: 'Object'
    };
    const expandList = new ExpandableList(expListProps);
    expandList.on.after.removal(() => TwoDLayout.panZoom.once());
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

    function attrUpdate(path, value) {
      const cabKey = cabinetKey(path);
      const decimal = new Measurement(value, true).decimal();
      if (!Number.isNaN(decimal)) {
        if (cabKey.cabinet[cabKey.key]() !== decimal) {
          cabKey.cabinet[cabKey.key](decimal);
          const parentCnt = du.find(parentSelector);
          // ExpandableList.refresh(du.find.down('.expandable-list', parentCnt), true);
        }
      } if (path.match('[0-9]{1,}\.name')) {
        cabKey.cabinet[cabKey.key].lastCall(value);
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

    bind(`[display-id="${displayId}"].cabinet-id-input`, (...args) => attrUpdate(...args));
    du.on.match('click', '.save-cabinet-btn', save);
    du.on.match('keydown', '.modifiable-value-input', updateValue);

    du.on.match('change', '.show-select', (elem) => {
      const side = elem.getAttribute('side');
      let type = du.find.closest('.show-select[name="type"]', elem).value;
      let endStyle = du.find.closest('.show-select[name="endStyle"]', elem).value;
      type = type === 'None' ? undefined : type;
      endStyle = endStyle === 'No' ? undefined : endStyle;
      Global.cabinet().value('show.' + side, {type, endStyle});
      Global.cabinet().hash();
      console.log(Global.cabinet().value('show'))

      console.log(Global.cabinet().hash());
    });

    du.on.match('change', '.toe-kick-cab-cnt input', (elem) => {
      const measurementInput = Lookup.get(elem.id);
      const measurement = measurementInput.measurement();
      const decimal = measurement.decimal();
      const name = elem.name;
      Global.cabinet().value(name, decimal);
    });

    Global.on.processing.cabinet((job, cabinet) => {
      const task = job.task();
      const expandHeader = du.find.up('.expand-header', du.find(`[cabinet-id='${cabinet.id()}']`));
      const loadingCnt = du.find.down('.circle-loading-cnt', expandHeader);
      const scope = {progress: task.progress, time: task.time,
        size: '20px', color: '#f09a05', id: String.random()
      }
      loadingCnt.innerHTML = CabinetDisplay.loadingTemplate.render(scope);
      (() => du.find.down('.time', loadingCnt).innerText = task.time())
          .periodic(100, () => task.progress() === 100);
      task.on.change(t => {
        document.documentElement.style.setProperty('--percentDecimal'+scope.id, task.progress()/100);
        document.documentElement.style.setProperty('--percent'+scope.id, task.progress() + '%');
        loadingCnt.hidden = task.progress() === 100;
        du.find.down('.progress', loadingCnt).innerText = Math.floor(task.progress());
      })
    })
  }
}

CabinetDisplay.loadingTemplate = new $t('loading/circle');
CabinetDisplay.simpleBodyTemplate = new $t('cabinet/simple');
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');
module.exports = CabinetDisplay
