


require('../../../public/js/utils/utils.js');
const $t = require('../../../public/js/utils/$t');
$t.loadFunctions(require('../generated/html-templates'))
require('./displays/user.js');

// Object Classes
require('./objects/assembly/init-assem');
const Order = require('./objects/order.js');
const Assembly = require('./objects/assembly/assembly.js');
const Properties = require('./config/properties.js');

// Display classes
const du = require('../../../public/js/utils/dom-utils.js');
const EPNTS = require('../generated/EPNTS.js');
const Displays = require('./services/display-svc.js');
const OrderDisplay = require('./displays/order.js');
const ThreeDModel = require('./three-d/three-d-model.js');
const PropertyDisplay = require('./displays/property.js');
const DisplayManager = require('./display-utils/displayManager.js');
const utils = require('./utils.js');

// Run Tests
require('../test/run');

function updateDivisions (target) {
  const name = target.getAttribute('name');
  const index = Number.parseInt(target.getAttribute('index'));
  const value = Number.parseFloat(target.value);
  const inputs = target.parentElement.parentElement.querySelectorAll('.division-pattern-input');
  const uniqueId = du.find.up('.opening-cnt', target).getAttribute('opening-id');
  const opening = Assembly.get(uniqueId);
  const values = opening.dividerLayout().fill;
  for (let index = 0; values && index < inputs.length; index += 1){
    const value = values[index];
    if(value) inputs[index].value = value;
  }
  updateModel(opening);
}

function getValue(code, obj) {
  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
  return CONSTANTS[code].value;
}



function init(body){
  Properties.load(body);
  let roomDisplay;
  let order;

  const propertyDisplay = new PropertyDisplay('#property-manager');
  Displays.register('propertyDisplay', propertyDisplay);
  require('./cost/init-costs.js');
  du.on.match('change', '.open-orientation-radio,.open-division-input', utils.updateDivisions);
  const CostManager = require('./displays/managers/cost.js');
  const costManager = new CostManager('cost-manager', 'cost');
  orderDisplay = new OrderDisplay('#app');
  setTimeout(ThreeDModel.init, 1000);
  const mainDisplayManager = new DisplayManager('display-ctn', 'menu', 'menu-btn');
}

Request.get(EPNTS.config.get(), init, console.error);
