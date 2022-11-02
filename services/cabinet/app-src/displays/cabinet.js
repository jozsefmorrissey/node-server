


const Show = require('../show.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const ThreeDMain = require('../displays/three-d-main.js');
const TwoDLayout = require('../two-d/layout');
const OpenSectionDisplay = require('./open-section.js');
const CabinetConfig = require('../config/cabinet-configs.js');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
const ExpandableList = require('../../../../public/js/utils/lists/expandable-list.js');
const Measurement = require('../../../../public/js/utils/measurement.js');
const Request = require('../../../../public/js/utils/request.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const bind = require('../../../../public/js/utils/input/bind.js');
const $t = require('../../../../public/js/utils/$t.js');
const { Object2d } = require('../objects/layout.js');//.Object2d;
const Inputs = require('../input/inputs.js');
const EPNTS = require('../../generated/EPNTS');


function getHtmlElemCabinet (elem) {
  const cabinetId = du.find.up('[cabinet-id]', elem).getAttribute('cabinet-id');
  return Cabinet.get(cabinetId);
}

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
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({cabinet, $index, displayValue, displayId});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      if (expandList.activeKey() === $index) {
        TwoDLayout.panZoom.once();
        ThreeDMain.update(cabinet);
      }
      const scope = {$index, cabinet, showTypes, OpenSectionDisplay};
      return CabinetDisplay.bodyTemplate.render(scope);
    }

    function inputValidation(values) {
      // const validName = values.name !== undefined;
      // const validType = CabinetConfig.valid(values.type, values.id);
      if(true) return true;
      return {type: 'You must select a defined type.'};
    }

    function updateLayout(target) {
      setTimeout(() => {
        const attr = target.name === 'thickness' ? 'height' : 'width';
        const cabinet = getHtmlElemCabinet(target);
        const obj2d = Object2d.get(cabinet.id());
        const value = new Measurement(target.value, true).decimal();
        console.log('new cab val', value);
        obj2d.topview()[attr](value);
        TwoDLayout.panZoom.once();
      }, 1000);
    }

    du.on.match('change', '.cabinet-input.dem[name="width"],.cabinet-input.dem[name="thickness"', updateLayout);
    du.on.match('blur', '.cabinet-input.dem[name="width"],.cabinet-input.dem[name="thickness"', updateLayout);

    function updateCabValue(cabinet, attr) {
      const inputCnt = du.find(`[cabinet-id='${cabinet.id()}']`);
      const input = du.find.down(`[name='${attr}']`, inputCnt);
      input.value = displayValue(cabinet[attr]());
    }

    function removeFromLayout(elem, cabinet) {
      group.room().layout().removeByPayload(cabinet);
      TwoDLayout.panZoom.once();
    }

    function linkLayout(cabinet, obj2d) {
      const topview = obj2d.topview();
      if (topview.width() !== cabinet.width()) {
        cabinet.width(topview.width());
        updateCabValue(cabinet, 'width');
      }
      if (topview.height() !== cabinet.thickness()) {
        cabinet.thickness(topview.height());
        updateCabValue(cabinet, 'thickness');
      }
    }

    function updateObjLayout(cabinet) {
      const obj2d = group.room().layout().addObject(cabinet.id(), cabinet, cabinet.name);
      obj2d.topview().onChange(() => linkLayout(cabinet, obj2d));
    }

    const getObject = (values) => {
      const cabinet = CabinetConfig.get(group, values.type, values.propertyId, values.name || values.id);
      setTimeout(() => updateObjLayout(cabinet));
      return cabinet;
    };
    this.active = () => expandList.active();
    const expListProps = {
      list: group.objects,
      dontOpenOnAdd: true,
      type: 'top-add-list',
      inputTree:   CabinetConfig.inputTree(),
      parentSelector, getHeader, getBody, getObject, inputValidation,
      listElemLable: 'Cabinet'
    };
    const expandList = new ExpandableList(expListProps);
    expandList.afterRemoval(removeFromLayout);
    this.refresh = () => expandList.refresh();

    const cabinetKey = (path) => {
      const split = path.split('.');
      const index = split[0];
      const key = split[1];
      const cabinet = expListProps.list[index];
      return {cabinet, key};
    }

    const valueUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      const decimal = new Measurement(value, true).decimal();
      cabKey.cabinet.value(cabKey.key, !Number.isNaN(decimal) ? decimal : val);
      TwoDLayout.panZoom.once();
      ThreeDMain.update(cabKey.cabinet);
    }

    const attrUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      cabKey.cabinet[cabKey.key](value);
      TwoDLayout.panZoom.once();
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

    CabinetConfig.onUpdate(() => props.inputOptions = CabinetConfig.list());
    bind(`.cabinet-input`, valueUpdate,
                  {validation: Measurement.validation('(0,)')});
    bind(`[display-id="${displayId}"].cabinet-id-input`, attrUpdate);
    du.on.match('click', '.save-cabinet-btn', save);
  }
}
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');
module.exports = CabinetDisplay
