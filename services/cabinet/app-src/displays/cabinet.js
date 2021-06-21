

class CabinetDisplay {
  constructor(room) {
    const propertySelectors = {};
    const parentSelector = `[room-id="${room.id}"].cabinet-cnt`;
    let propId = 'Half Overlay';
    const instance = this;
    this.propId = (id) => {
      if (id ===  undefined) return propId;
      propId = id;
    }
    const getHeader = (cabinet, $index) =>
        CabinetDisplay.headTemplate.render({room, cabinet, $index});
    const showTypes = Show.listTypes();
    const getBody = (cabinet, $index) => {
      if (propertySelectors[cabinet.uniqueId] === undefined)
        propertySelectors[cabinet.uniqueId] = Select.propertyId(cabinet.propertyId());
      if (expandList.activeIndex() === $index)
        ThreeDModel.render(cabinet);
      const selectHtml = propertySelectors[cabinet.uniqueId].html();
      const scope = {room, $index, cabinet, showTypes, OpenSectionDisplay, selectHtml};
      return CabinetDisplay.bodyTemplate.render(scope);
    }

    function inputValidation(values) {
      const validName = values.name !== undefined;
      const validType = CabinetConfig.valid(values.type, values.id);
      if(validType) return true;
      return {type: 'You must select a defined type.'};
    }
    const getObject = (values) => {
      return CabinetConfig.get(values.name, values.type, values.propertyId, values.id);
    };
    this.active = () => expandList.active();
    const expListProps = {
      list: room.cabinets,
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
      cabKey.cabinet.value(cabKey.key, new Measurement(value).decimal());
      ThreeDModel.render(cabKey.cabinet);
    }

    const attrUpdate = (path, value) => {
      const cabKey = cabinetKey(path);
      cabKey.cabinet[cabKey.key] = value;
    }

    const saveSuccess = () => console.log('success');
    const saveFail = () => console.log('failure');
    const save = (target) => {
      const index = target.getAttribute('index');
      const cabinet = expListProps.list[index];
      if (cabinet.name !== undefined) {
        Request.post(EPNTS.cabinet.add(cabinet.name), cabinet.toJson(), saveSuccess, saveFail);
        console.log('saving');
      } else {
        alert('Please enter a name if you want to save the cabinet.')
      }
    }

    CabinetConfig.onUpdate(() => props.inputOptions = CabinetConfig.list());
    bindField(`[room-id="${room.id}"].cabinet-input`, valueUpdate, Measurement.validation('(0,)'));
    bindField(`[room-id="${room.id}"].cabinet-id-input`, attrUpdate);
    matchRun('click', '.save-cabinet-btn', save);
  }
}
CabinetDisplay.bodyTemplate = new $t('cabinet/body');
CabinetDisplay.headTemplate = new $t('cabinet/head');
