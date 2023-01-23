
const Order = require('../objects/order.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const $t = require('../../../../public/js/utils/$t.js');
const OrderSaveManager = require('../services/order-save-manager.js');
const DecisionInputTree = require('../../../../public/js/utils/input/decision/decision.js');
const DataList = require('../../../../public/js/utils/input/data-list.js');
const Input = require('../../../../public/js/utils/input/input.js');
const NoActivityRunner = require('../../../../public/js/utils/services/no-activity-runner.js');

const orderSelectCnt = du.id('order-select-cnt');
const orders = {};
let order = new Order(new Date().toLocaleDateString("en-US", options));

var options = {  year: 'numeric', day: 'numeric' };
var today  = new Date();

console.log(today.toLocaleDateString("en-US", options)); // Saturday, September 17, 2016
order.addRoom('kitchen');


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
const orderNameInput = du.find('input[name="order-name"]');
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

function saveAllOrders() {
  const  orderNames = Object.keys(orders);
  for (let  index = 0; index < orderNames.length; index++) {
    const orderName = orderNames[index];
    const versionIds = Object.keys(orders[orderName]);
    for (let vIndex = 0; vIndex < versionIds.length; vIndex++) {
      const versionId = versionIds[vIndex];
      const order = orders[orderName][versionId];
      saveMan.save(orderName, versionId, order.toJson());
    }
  }
}

du.on.match('click', `#${saveCntId}>button`, async (elem) =>{
  if (elem.innerText === 'Choose Save Location') {
    await saveMan.init();
    orderSelCnt.hidden = false;
    elem.innerHTML = 'Save';
  } else {
    const orderName = orderInput.value();
    const versionId = versionInput.value() || 'original';
    switch (elem.innerText) {
      case 'Create':
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
  saveMan.on(true);
  noActRunnner();
})

function updateButtonText() {
  const inputOrderName = orderInput.value();
  const inputVersionId = versionInput.value();
  const state = saveMan.state(inputOrderName, inputVersionId);
  let buttonText;
  switch (state) {
    case 'new order': buttonText = 'Create'; break;
    case 'new version': buttonText = 'Create'; break;
    case 'active': buttonText = 'Save'; break;
    case 'switch version': buttonText = 'Open'; break;
    case 'switch order': buttonText = 'Open'; break;
  }
  orderButton.innerText = buttonText;

}

const orderButton = du.find(`#${saveCntId}>button`);
const rename = () => orderButton.innerText === 'Rename';
function updateOrderInput() {
  orderDataList.setList(saveMan.orderNames());
  const orderName = orderInput.value() || saveMan.activeOrderName();
  versionDataList.setList(saveMan.versionIds(orderName));
  if (orderButton.innerText !== 'Rename') updateButtonText();
}
function onVersionChange(elem, details) {
  setCookie();
}
const timeCnt = du.id('save-time-cnt');
function updateTime() {
  timeCnt.innerText = `Last Save: ${new Date().toLocaleTimeString()}`;
}
du.on.match('click', '#save-time-cnt', () => saveMan.save() || resetOrderAndVersion());

function switchOrder(elem, details) {
  updateOrderInput();
  if (details.contents === '') return order = new Order(details.orderName);
  try {
    order = Object.fromJson(JSON.parse(details.contents));
    console.log('details');
  } catch (e) {
    console.warn(e);
  }
}

function resetOrderAndVersion(elem, details) {
  orderInput.setValue(saveMan.activeOrderName());
  versionInput.setValue(saveMan.activeVersionId());
  updateOrderInput();
}

let orderChangeInFocus = false;
const noActRunnner2 = new NoActivityRunner(60000, resetOrderAndVersion);
du.on.match('keypress,click', `#${saveCntId}`, (elem) => {
  noActRunnner2();
});

du.on.match('dblclick', `#${saveCntId}`, (elem) => {
  if (rename()) {
    updateButtonText();
  } else {
    resetOrderAndVersion();
    orderButton.innerText = 'Rename';
  }
});


orderInput.on('keyup,change', updateOrderInput);
versionInput.on('keyup,change', updateOrderInput);
orderInput.on('focusin', () => !rename() && orderInput.setValue(''));
versionInput.on('focusin', () => !rename() && versionInput.setValue(''));

saveMan.onFileSystemChange(updateOrderInput);
saveMan.onLoaded(resetOrderAndVersion);
saveMan.onVersionChange(onVersionChange);
saveMan.onSaved(updateTime);
saveMan.onVersionChange(switchOrder);

module.exports = obj;
