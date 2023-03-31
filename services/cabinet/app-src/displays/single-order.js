
const Order = require('../objects/order.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const OrderSaveManager = require('../services/order-save-manager.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const DataList = require('../../../../public/js/utils/input/data-list.js');
const Input = require('../../../../public/js/utils/input/input.js');
const NoActivityRunner = require('../../../../public/js/utils/services/no-activity-runner.js');

const orderSelectCnt = du.id('order-select-cnt');
const orderNameInput = du.id('order-name-input');
const orderVersionInput = du.id('order-version-input');
const dateStr = new Date().toLocaleDateString("en-US", options).replace(/\//g, '-');
let order = new Order(`Orderststs ${dateStr}`);
orderNameInput.value = order.name();
orderVersionInput.value = order.versionId();

var options = {  year: 'numeric', day: 'numeric' };
var today  = new Date();

console.log(today.toLocaleDateString("en-US", options)); // Saturday, September 17, 2016
order.addRoom('kitchen');

const RoomDisplay = require('./room');
let roomDisplay = new RoomDisplay('#room-cnt', order);

du.on.match('click', '#copy-order', (elem) => {
  du.copy(JSON.stringify(order.toJson()));
});
du.on.match('click', '#paste-order', async (elem) => {
  navigator.clipboard.readText()
    .then(text => {
      try {
        const order = Object.fromJson(JSON.parse(text));
        switchOrder(elem, order);
        if (!(order instanceof Order)) throw new Error();
      } catch (e) {
        alert('clipboard does not contain a valid Order');
      }
    })
    .catch(err => {
      console.error('Failed to read clipboard contents: ', err);
    });
});


const saveCntId = 'order-select-cnt';
const getAutoSaveElem = (selector) => () => du.find.down(selector, du.id(saveCntId));
const getStatusElem = getAutoSaveElem('.status');
const getAutoSaveBtn = getAutoSaveElem('button');

const cookieId = () => `last-active-order`;
const cookieValue = () => `${saveMan.activeOrderName()},${saveMan.activeVersionId()}`;
const setCookie = () => du.cookie.set(cookieId(), cookieValue());
const getCookie = () => du.cookie.get(cookieId(), ',', 'name', 'version');

const cookieVals = getCookie();
const orderName = cookieVals.name || order.name();
const versionId = cookieVals.version || 'original';


let counter = 0;
const saveMan = new OrderSaveManager(() => order.toJson(), orderName, versionId);

const obj = {order: () => order};

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
  label: 'Order:'
});

const versionInput = new Input({
  name: 'version',
  inline: true,
  label: 'Version:'
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
        saveMan.switch(orderName, versionId);
        break;
      case 'Save':
        saveMan.save();
        break;
      case 'Open':
        saveMan.switch(orderName, versionId);
        break;
    }
  }
});

const noActRunnner = new NoActivityRunner(10000, () => saveMan.on(false));
du.on.match('mouseout', '*', (elem) => {
  saveMan.on(saveMan.initialized());
  noActRunnner();
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
const timeCnt = du.id('save-time-cnt');
function updateTime() {
  timeCnt.innerText = `Last Save: ${new Date().toLocaleTimeString()}`;
}
du.on.match('click', '#save-time-cnt', () => saveMan.save() || resetOrderAndVersion());

let firstSwitch = true;
function switchOrder(elem, details) {
  if (order.worthSaveing()) {
    if (firstSwitch) {
      const state = saveMan.state(order.name(), order.versionId());
      if (state === 'new order' || state === 'new version') {
        saveMan.save(order.name(), order.versionId());
      } else if (state === 'switch order' || state === 'active') {
        const notTakenVersion = saveMan.undefinedVersion(order.name(), order.versionId());
        if (confirm(`An order and version already exist with this\nname/version: '${order.name()}'/'${order.versionId()}'.\n\nPress ok to save as '${order.name()}'/'${notTakenVersion}'\nor\nPress cancel to avoid it being saving.`) == true) {
          saveMan.save(order.name(), notTakenVersion, order.toJson());
        }
      }
    }
  }
  firstSwitch = false;
  updateOrderInput();
  if (details.contents === '') return order = new Order(details.orderName, details.versionId);
  try {
    if (details.contents) {
      order = Object.fromJson(JSON.parse(details.contents));
    } if (details instanceof Order) order = details;
    else throw new Error('unknown order format');
    roomDisplay.order(order);
    orderNameInput.value = order.name(order.name());
    orderVersionInput.value = order.versionId(order.versionId());
    resetOrderAndVersion();
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
  if (!saveMan.on()) {
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

orderInput.on('keyup,change,click', updateOrderInput);
versionInput.on('keyup,change,click', updateOrderInput);
orderInput.on('change', () =>  versionInput.setValue(''));
orderInput.on('focusin', () => orderInput.setValue(''));
versionInput.on('focusin', () => versionInput.setValue(''));

saveMan.onFileSystemChange(updateOrderInput);
saveMan.onLoaded(resetOrderAndVersion);
saveMan.onVersionChange(onVersionChange);
saveMan.onSaved(updateTime);
saveMan.onVersionChange(switchOrder);

module.exports = obj;
