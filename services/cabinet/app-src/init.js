


require('../../../public/js/utils/utils.js');
const $t = require('../../../public/js/utils/$t');
$t.loadFunctions(require('../generated/html-templates'));
require('./displays/user.js');

// Object Classes
// require('./bind.js');
require('./objects/assembly/init-assem');
require('./objects/joint/init');
require('./two-d/objects/snap/init');
const Order = require('./objects/order.js');
const Assembly = require('./objects/assembly/assembly.js');
const Properties = require('./config/properties.js');
const PopUp = require('../../../public/js/utils/display/pop-up.js');

// Display classes
const du = require('../../../public/js/utils/dom-utils.js');
const EPNTS = require('../generated/EPNTS.js');
const Displays = require('./services/display-svc.js');
const OrderDisplay = require('./displays/order.js');
const TwoDLayout = require('./two-d/layout.js');
const ThreeDMainModel = require('./displays/three-d-main.js');
const PropertyDisplay = require('./displays/property.js');
const DisplayManager = require('./display-utils/displayManager.js');
const utils = require('./utils.js');

// Run Tests
if (EPNTS.getEnv() === 'local') {
  require('../test/run');
}

function updateDivisions (target) {
  const name = target.getAttribute('name');
  const index = Number.parseInt(target.getAttribute('index'));
  const value = Number.parseFloat(target.value);
  const inputs = target.parentElement.parentElement.querySelectorAll('.division-pattern-input');
  const id = du.find.up('.opening-cnt', target).getAttribute('opening-id');
  const opening = Assembly.get(id);
  const values = opening.dividerLayout().fill;
  for (let index = 0; values && index < inputs.length; index += 1){
    const value = values[index];
    if(value) inputs[index].value = value;
  }
  ThreeDMainModel.update(opening);
}

function getValue(code, obj) {
  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
  return CONSTANTS[code].value;
}


const urlSuffix = du.url.breakdown().path.split('/')[2];
const pageId = {template: 'template-manager', cost: 'cost-manager', home: 'app',
                pattern: 'pattern-manager', property: 'property-manager-cnt'
              }[urlSuffix] || 'app';
function init(body){
  Properties.load(body);
  let roomDisplay;
  let order;

  const propertyDisplay = new PropertyDisplay('#property-manager');
  Displays.register('propertyDisplay', propertyDisplay);
  require('./cost/init-costs.js');
  const mainDisplayManager = new DisplayManager('display-ctn', 'menu', 'menu-btn', pageId);
  const modelDisplayManager = new DisplayManager('model-display-cnt', 'display-menu');
  if (urlSuffix === 'cost') {
    const CostManager = require('./displays/managers/cost.js');
    const costManager = new CostManager('cost-manager', 'cost');
  } else if (urlSuffix === 'template') {
    const TemplateManager = require('./displays/managers/template.js');
    const templateDisplayManager = new TemplateManager('template-manager');
  } else {
    du.on.match('change', '.open-orientation-radio,.open-division-input', updateDivisions);
    orderDisplay = new OrderDisplay('#order-cnt');
    setTimeout(TwoDLayout.init, 1000);
    setTimeout(ThreeDMainModel.init, 1000);
  }
}

Request.get(EPNTS.config.get(), init, console.error);

const popUp = new PopUp({resize: false, noBackdrop: true});

du.on.match('click', '*', (elem, event) => {
  const errorMsg = elem.getAttribute('error-msg');
  if (errorMsg) {
    popUp.positionOnElement(elem).bottom();
    popUp.updateContent(errorMsg);
    popUp.show();
    event.stopPropagation();
  } else popUp.close();
});
