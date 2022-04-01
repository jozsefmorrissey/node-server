
const $t = require('./../../../public/js/utils/$t.js');
$t.loadFunctions(require('../generated/html-templates'));
require('./../../../public/js/utils/utils.js')

const OrderInfo = require('../src/objects/order-info.js');
const Input = require('./../../../public/js/utils/input/input.js');
const Select = require('./../../../public/js/utils/input/styles/select.js');
const MeasurementInput = require('./../../../public/js/utils/input/styles/measurement.js');
const DrawerBox = require('../src/objects/lookup/drawer-box.js');
const BottomMaterial = require('../src/objects/lookup/bottom-material.js');
const BoxMaterial = require('../src/objects/lookup/box-material.js');
const Option = require('../src/objects/lookup/option.js');
const PerBoxCost = require('../src/objects/lookup/per-box-cost.js');
const Style = require('../src/objects/lookup/style.js');
const DecisionInputTree = require('./../../../public/js/utils/input/decision/decision')
const DrawerList = require('../src/objects/drawer-list')
const FROM_JSON = require('../src/utils').FROM_JSON;
const du = require('../../../public/js/utils/dom-utils.js');
const bind = require('../../../public/js/utils/input/bind.js');
const Inputs = require('../input/inputs.js');

const orderInfo = new OrderInfo();
orderInfo.jobName('plankys');
orderInfo.companyName('planks');
orderInfo.shippingAddress('909 wabash ave');
orderInfo.billingAddress('908 wisconsin dr');
orderInfo.phone('2172548654');
orderInfo.fax('faxy');
orderInfo.salesRep('greg');
orderInfo.email('me@awesome.cool');

const phoneNum = new Input({
  label: 'Phone Number',
  name: 'phoneNumber',
  validation: (value) => value.replace(/[^0-9]/g, '').length === 10,
  default: '',
  format: (value) => {
    const nums = value.replace(/[^0-9]/g, '');
    if (nums.length !== 10) return '';
    const areaCode = nums.substr(0,3);
    const prefix = nums.substr(3, 3);
    const suffix = nums.substr(6);
    return `(${areaCode})${prefix}\-${suffix}`;
  }
});

const width = Inputs('width', {value: 15});
const height = Inputs('height', {value: 6});
const depth = Inputs('depth', {value: 21});
const dems = [width, height, depth];

new BoxMaterial('Select White Soft Maple', 6, 6.65);
new BoxMaterial('Select Read Oak', 5.5, 6.15);
new BoxMaterial('Select Walnut', 11, 11.65);
new BoxMaterial('Rustic Walnut', 7, 7.65);
new BoxMaterial('Bass Wood', 5, 5.65);

const maple14 = new BottomMaterial('1/4" Maple A4', 2);
const maple12 = new BottomMaterial('1/2" Maple B1', 3);

const birtch14 = new BottomMaterial('1/4" Baltic Birtch BB/BB VC', .96);
const birtch12 = new BottomMaterial('1/2" Baltic Birtch BB/BB VC', 1.75);

const redOak14 = new BottomMaterial('1/4" Red Oak RC A3 VC', 2);
const redOak12 = new BottomMaterial('1/2" Red Oak RC A3 VC', 3);

const walnut14b = new BottomMaterial('1/4" Walnut B2 VC', 3.3);
const walnut14a = new BottomMaterial('1/4" Walnut A4 MDF Core', 3.32);
const walnut12 = new BottomMaterial('1/2" Walnut A1 Only VC', 4.62);

new PerBoxCost('Unassembles w/o Bottoms', 6);
new PerBoxCost('Unassembles w Bottoms', 8);
new PerBoxCost('Assembled Unfinished', 10);
new PerBoxCost('Assembled Prefinished - 1 Topcoat', 16);
new PerBoxCost('Assembled Prefinished - 2 Topcoat', 20);

const radius = new Option('Radius Top Edge After Assembly', 3).input();
const notch = new Option('Notch & Drill w/1/2" Inset Bottom for Under Mount Slides', 1.5).input();
const braning = new Option('Branding Inside of Box', 1.5).input();
const scoop = new Option('Standard Scoop', 3).input();

new Style('Standard', 0);
new Style('Scalloped Sides', 5);
new Style('Full Dovetail Pluming Notch', 35);
new Style('Signature Trash Rollout', 30);
new Style('Corner Drawers w/Dovetailed 90&#176; Corner & Glue & Pin 135&#176; Corner', 40);

const finishing = new Select({
  name: 'finishing',
  class: 'center',
  format: PerBoxCost.get,
  list: PerBoxCost.selectList(),
});

const style = new Select({
  name: 'style',
  class: 'center',
  list: Style.selectList(),
  format: Style.get,
});

const typeList = BoxMaterial.selectList();
const type = new Select({
  label: 'Sides',
  name: 'sides',
  class: 'center',
  format: BoxMaterial.get,
  list: typeList,
});

const quantity = new Input({
  label: 'Quantity',
  name: 'quantity',
  type: 'number',
  value: 1
});

const notes = new Input({
  label: 'Notes',
  name: 'notes',
  type: 'text'
});

const softMapleBottoms = BottomMaterial.select(maple14, maple12, birtch14, birtch12);
const redOakBottoms = BottomMaterial.select(redOak14, redOak12);
const selWalnutBottoms = BottomMaterial.select(walnut12, walnut14a, walnut14b);
const rusWalnutBottoms = BottomMaterial.select(walnut12, walnut14b);
const bassBottoms = BottomMaterial.select(maple14, maple12, birtch14, birtch12);

// const decisionInput = new DecisionInputTree('Add Box',
//   [style, finishing, type, notch, braning, scoop, width, height, depth, quantity, notes]);
//
// decisionInput.addStates({softMapleBottoms, redOakBottoms, selWalnutBottoms,
//           bassBottoms, rusWalnutBottoms,
//           radius});
//
// const finishValues = Object.values(PerBoxCost.selectList());
// decisionInput.then(`finishing:${finishValues[2]}`)
//         .jump('radius');
// decisionInput.then(`finishing:${finishValues[3]}`)
//         .jump('radius');
//
// const typeNames = Object.values(typeList);
// decisionInput.then(`sides:${typeNames[0]}`)
//         .jump('softMapleBottoms');
// decisionInput.then(`sides:${typeNames[1]}`)
//         .jump('redOakBottoms');
// decisionInput.then(`sides:${typeNames[2]}`)
//         .jump('selWalnutBottoms');
// decisionInput.then(`sides:${typeNames[3]}`)
//         .jump('rusWalnutBottoms');
// decisionInput.then(`sides:${typeNames[4]}`)
//         .jump('bassBottoms');

function sendEmail() {
    var email = 'jozsef.morrissey@gmail.com';
    var subject = 'drawer order';
    let html = du.id('drawer-form').outerHTML;
    var emailBody = encodeURIComponent(html);
    document.location = "mailto:"+email+"?subject="+subject+"&body="+emailBody;
}

du.on.match('click', '#submit', sendEmail);


decisionInput.onChange(() => {
  const box = new DrawerBox(decisionInput.values());

  const cost = box.cost();
  if (cost) du.id('current-cost').innerHTML = cost;
  else du.id('current-cost').innerHTML = '';
});

const orderTemplate = new $t('drawer-box/order-info');
const tableTemplate = new $t('drawer-box/table');
decisionInput.onComplete(() => {
  const box = new DrawerBox(decisionInput.values());
  const drawerList = orderInfo.drawerList();
  drawerList.add(box);
  const collection = drawerList.collection();
  DrawerBox.resetCount();
  du.id('order-cnt').innerHTML = orderTemplate.render(orderInfo);
  du.id('table-cnt').innerHTML = tableTemplate.render(collection);
  let totalCost = 0;
  collection.forEach((drawerList) => totalCost += drawerList.cost());
  du.id('total-cost').innerHTML = totalCost;

  console.log(collection);
});


du.id('order-info-cnt').innerHTML = orderTemplate.render(orderInfo);
bind('.dynamic', orderInfo, {inputs: {phone: phoneNum}});

// const headTemplate = new $t('drawer-box/head');
// const bodyTemplate = new $t('drawer-box/body');
// const expListProps = {
//   parentSelector: `#box-list`,
//   inputTree:   decisionInput,
//   getHeader: (scope) => headTemplate.render(scope),
//   getBody: (scope) => bodyTemplate.render(scope),
//   getObject: (values) => new DrawerBox(values),
//   listElemLable: 'Drawer B'
// };
// const expandList = new ExpandableList(expListProps);
du.id('cost-tree').innerHTML = decisionInput.html();

this.editClass = () => `drawer-list`;
bind(`.${this.editClass()}`, this, {inputs: {style}});
