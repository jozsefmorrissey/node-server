


const Show = require('../show.js');
const Select = require('../../../../public/js/utils/input/styles/select.js');
const ThreeDMain = require('../displays/three-d-main.js');
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
    const propertySelectors = {};
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
      if (propertySelectors[cabinet.uniqueId()] === undefined)
        propertySelectors[cabinet.uniqueId()] = Inputs('propertyIds', { value: cabinet.propertyId() });
      if (expandList.activeKey() === $index)
        ThreeDMain.update(cabinet);
      const selectHtml = propertySelectors[cabinet.uniqueId()].html();
      const scope = {$index, cabinet, showTypes, OpenSectionDisplay, selectHtml};
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
        const obj2d = Object2d.get(cabinet.uniqueId());
        const value = cabinet[target.name]();
        obj2d.topview()[attr](value);
      });
    }

    du.on.match('change', '.cabinet-input.dem[name="width"],.cabinet-input.dem[name="thickness"', updateLayout);
    du.on.match('blur', '.cabinet-input.dem[name="width"],.cabinet-input.dem[name="thickness"', updateLayout);

    function updateCabValue(cabinet, attr) {
      const inputCnt = du.find(`[cabinet-id='${cabinet.uniqueId()}']`);
      const input = du.find.down(`[name='${attr}']`, inputCnt);
      input.value = displayValue(cabinet[attr]());
    }

    function linkLayout(cabinet, obj2d) {
      console.log('linking!')
      const square = obj2d.topview().object();
      if (square.width() !== cabinet.width()) {
        cabinet.width(square.width());
        updateCabValue(cabinet, 'width');
      }
      if (square.height() !== cabinet.thickness()) {
        cabinet.thickness(square.height());
        updateCabValue(cabinet, 'thickness');
      }
    }

    const getObject = (values) => {
      const cabinet = CabinetConfig.get(group, values.type, values.propertyId, values.id);
      const obj2d = group.room().layout().addObject(cabinet.uniqueId());
      obj2d.topview().onChange(() => linkLayout(cabinet, obj2d));
      return cabinet;
    };
    this.active = () => expandList.active();
    const expListProps = {
      list: group.cabinets,
      inputTree:   CabinetConfig.inputTree(),
      parentSelector, getHeader, getBody, getObject, inputValidation,
      listElemLable: 'Cabinet'
    };
    const expandList = new ExpandableList(expListProps);
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
      ThreeDMain.update(cabKey.cabinet);
    }

    const attrUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      cabKey.cabinet[cabKey.key](value);
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
