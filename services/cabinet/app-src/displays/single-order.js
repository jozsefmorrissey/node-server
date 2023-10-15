
const Order = require('../objects/order.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const OrderSaveManager = require('../services/order-save-manager.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const DataList = require('../../../../public/js/utils/input/data-list.js');
const Input = require('../../../../public/js/utils/input/input.js');
const NoActivityRunner = require('../../../../public/js/utils/services/no-activity-runner.js');
const Global = require('../services/global');

const orderSelectCnt = du.id('order-select-cnt');
const orderNameInput = du.id('order-name-input');
const orderVersionInput = du.id('order-version-input');
const chooseSaveLocBtn = du.find.closest('.auto-save-btn', orderSelectCnt);
// orderNameInput.value = Global.order().name();
// orderVersionInput.value = Global.order().versionId();

let orderModified = false;
const preSaveLocationChecks = () => {
  if (saveMan.initialized()) return;
  const order = Global.order();
  if (order.worthSaveing()) {
    if (orderNameInput.value !== '') {
      chooseSaveLocBtn.disabled = false;
      du.class.remove(orderNameInput, 'error');
    } else {
      chooseSaveLocBtn.disabled = true;
      du.class.add(orderNameInput, 'error');
    }
  } else {
    chooseSaveLocBtn.disabled = false;
  }
}

const modSelector = '.cabinet-header, #order-name-input, .decision-input-tree-submit, .add-object-btn-2d';
du.on.match('click:keyup', modSelector, preSaveLocationChecks);



Global.order().addRoom('kitchen');

const RoomDisplay = require('./room');
let roomDisplay = new RoomDisplay('#room-cnt', Global.order());
Global.displays.room(roomDisplay);

// du.on.match('click', '#copy-order', (elem) => {
//   du.copy(JSON.stringify(Global.order().toJson()));
// });
// du.on.match('click', '#paste-order', async (elem) => {
//   navigator.clipboard.readText()
//     .then(text => {
//       try {
//         const order = Object.fromJson(JSON.parse(text));
//         if (!(order instanceof Order)) throw new Error();
//         switchOrder(elem, order);
//         Global.order(order);
//       } catch (e) {
//         alert('clipboard does not contain a valid Order');
//       }
//     })
//     .catch(err => {
//       console.error('Failed to read clipboard contents: ', err);
//     });
// });
//

const saveCntId = 'order-select-cnt';
const getAutoSaveElem = (selector) => () => du.find.down(selector, du.id(saveCntId));
const getStatusElem = getAutoSaveElem('.status');
const getAutoSaveBtn = getAutoSaveElem('button');

const cookieId = () => `deku-cust-cab-active-order`;
const cookieValue = () => `${saveMan.activeOrderName()},${saveMan.activeVersionId()}`;
const setCookie = () => du.cookie.set(cookieId(), cookieValue());
const getCookie = () => du.cookie.get(cookieId(), ',', 'name', 'version');

const cookieVals = getCookie();
const orderName = cookieVals.name || Global.order().name();
const versionId = cookieVals.version || 'original';


let counter = 0;
// kitty is stored within cookie
const saveMan = new OrderSaveManager(() => Global.order().toJson(), orderName, versionId);

function onChange(values, dit) {
  console.log('change');
}

function onSubmit(values, dit) {
  console.log('submit');
}

const orderSelCnt = du.id('order-selector-cnt');
const orderInput = new Input({
  name: 'order',
  inline: true,
  label: 'Order:',
  validation: () => true
});

const versionInput = new Input({
  name: 'version',
  inline: true,
  label: 'Version:',
  validation: () => true
});
orderSelCnt.innerHTML = orderInput.html() + versionInput.html();

const orderDataList = new DataList(orderInput);
const versionDataList = new DataList(versionInput);

du.on.match('click', `#${saveCntId}>button`, async (elem) =>{
  if (elem.innerText === 'Choose Save Location') {
    await saveMan.init();
    orderSelCnt.hidden = false;
    elem.innerHTML = 'Open/Create';
  } else {
    const orderName = orderInput.value();
    const versionId = versionInput.value();
    switch (elem.innerText) {
      case 'Create':
        versionId ||= 'original';
        await saveMan.switch(orderName, versionId);
        setCookie();
        break;
      case 'Save':
        await saveMan.save();
        break;
      case 'Open':
        await saveMan.switch(orderName, versionId);
        setCookie();
        break;
    }
  }
});

// const noActRunnner = new NoActivityRunner(10000, () => saveMan.on_off_toggle(false));
du.on.match('mouseout', '*', (elem) => {
  saveMan.on_off_toggle(saveMan.initialized());
})

function updateButtonText() {
  const inputOrderName = orderInput.value();
  const inputVersionId = versionInput.value();
  const state = saveMan.state(inputOrderName, inputVersionId);
  let buttonText = 'Open/Create';
  orderButton.disabled = false;
  switch (state) {
    case 'new order': buttonText = 'Create'; break;
    case 'new version': buttonText = 'Create'; break;
    case 'active': buttonText = 'Save'; break;
    case 'switch version': buttonText = 'Open'; break;
    case 'switch order': buttonText = 'Open'; break;
    default:
      orderButton.disabled = true;
  }
  orderButton.innerText = buttonText;

}

const orderButton = du.find(`#${saveCntId}>button`);
function updateOrderInput() {
  orderDataList.setList(saveMan.orderNames());
  const orderName = orderInput.value() || saveMan.activeOrderName();
  versionDataList.setList(saveMan.versionIds(orderName));
  updateButtonText();
}
function onVersionChange(elem, details) {
  setCookie();
}
du.on.match('click', '#save-time-cnt', () => saveMan.save() || resetOrderAndVersion());

let firstSwitch = true;
async function switchOrder(elem, details) {
  let order = Global.order();
  if (order.name() === details.orderName && order.versionId() === details.versionId) return;
  updateOrderInput();
  if (details instanceof Order) {
    order = details;
    orderNameInput.value = order.name();
    orderVersionInput.value = order.versionId();
    Global.order(order);
    return;
  }
  try {
    if (details.contents) {
      let shouldSwitch = true;
      if (firstSwitch && order.worthSaveing()) {
        const name = order.name();
        const version = order.versionId();
        shouldSwitch = false;
      }
      if (shouldSwitch) {
        order = Object.fromJson(details.contents);
      }
    }
    if (!(order instanceof Order)) throw new Error('unknown order format');
    orderNameInput.value = order.name();
    orderVersionInput.value = order.versionId();
    Global.order(order);
    resetOrderAndVersion();
    const state = saveMan.state(order.name(), order.versionId());
    setCookie();
  } catch (e) {
    console.warn(e);
  }
}

function resetOrderAndVersion() {
  orderInput.setValue('');
  versionInput.setValue('');
  updateOrderInput();
}

let orderChangeInFocus = false;

let processing;
du.on.match('focusout:enter', '#order-name-input', async () => {
  const newName = orderNameInput.value;
  const order = Global.order();
  if (!saveMan.initialized()) {
    order.name(newName);
  } else if (!processing && newName !== order.name()) {
    if (confirm(`This will rename all versions. From '${order.name()}' to '${newName}'\n\nAre you sure?`) == true) {
      processing = true;
      await saveMan.changeOrderName(newName);
      processing = false;
    } else {
      orderNameInput.value = order.name();
    }
  }
})

const onOrderLocationChange = () => {
  const name = orderNameInput.value;
  const version = orderVersionInput.value;
  const order = Global.order();
  if (!saveMan.initialized()) {
    order.name(name);
    order.versionId(version);
    saveMan.initialOrderName(name);
    saveMan.initialVersionId(version);
  }
}

du.on.match('keyup', '#order-name-input,#order-version-input', onOrderLocationChange);

orderInput.on('keyup,change,click', updateOrderInput);
versionInput.on('keyup,change,click', updateOrderInput);
orderInput.on('change', () =>  versionInput.setValue(''));
orderInput.on('focusin', () => orderInput.setValue(''));
versionInput.on('focusin', () => versionInput.setValue(''));

const timeCnt = du.id('save-time-cnt');
const selectCnt = du.find('#order-select-cnt');
function infoText(text) {
  return () => {
    if (text) du.class.add(selectCnt, 'saving');
    else du.class.remove(selectCnt, 'saving');
    timeCnt.innerText = text || `Last Save: ${new Date().toLocaleTimeString()}`;

  }
}

saveMan.onSaving(infoText('Saving...'));
saveMan.onSaved(infoText(''));

saveMan.onFileSystemChange(updateOrderInput);
saveMan.onLoaded(resetOrderAndVersion);
saveMan.onVersionChange(onVersionChange);
saveMan.onVersionChange(switchOrder);
