require('../../../public/js/utils/utils.js');
require('../../../public/js/utils/object/json-utils.js');
const $t = require('../../../public/js/utils/$t');
$t.loadFunctions(require('../generated/html-templates'));
// const User = require('./displays/user.js');

// Object Classes
// require('./bind.js');
require('./objects/simple/init')
require('./objects/assembly/init-assem');
require('./objects/joint/init');
const Assembly = require('./objects/assembly/assembly.js');
const Properties = require('./config/properties.js');
const PopUp = require('../../../public/js/utils/display/pop-up.js');

// Display classes
const du = require('../../../public/js/utils/dom-utils.js');
const EPNTS = require('../generated/EPNTS.js');
const Global = require('./services/global.js');
require('./objects/room');
const TwoDLayout = require('./displays/two-d-layout.js');
const ThreeDMainModel = require('./displays/three-d-main.js');
require('./three-d/layout/init');
require('./displays/opening-sketch.js')
const PropertyDisplay = require('./displays/property.js');
const DisplayManager = require('./display-utils/displayManager.js');
const utils = require('./utils.js');
const Frame = require('./objects/assembly/assemblies/frame.js');
const Panel = require('./objects/assembly/assemblies/panel.js');

let orderDisplay;

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


const breakPathSplit = du.url.breakdown().path.split('/');
const urlSuffix = breakPathSplit.length === 3 ? breakPathSplit[2] : undefined;
const pageId = {template: 'template-manager', cost: 'cost-manager', home: 'app',
                pattern: 'pattern-manager', property: 'property-manager-cnt'
              }[urlSuffix] || 'app';
function init(body){
  if (body) Properties.load(body);

  if (urlSuffix && urlSuffix !== 'order') {
      require('./cost/init-costs.js');
      Global.displays.main(new DisplayManager('display-ctn', 'menu', 'menu-btn', pageId));
      if (urlSuffix === 'cost') {
        const CostManager = require('./displays/managers/cost.js');
        const costManager = new CostManager('cost-manager', 'cost');
      } else if (urlSuffix === 'template') {
        const TemplateManager = require('./displays/managers/template.js');
        // const templateDisplayManager = new TemplateManager('template-manager');
      } else {
        require('./displays/canvas');
        const propertyDisplay = new PropertyDisplay('#property-manager');
        Global.displays.property(propertyDisplay);
        const OrderDisplay = require('./displays/order.js');
        du.on.match('change', '.open-orientation-radio,.open-division-input', updateDivisions);
        orderDisplay = new OrderDisplay('#order-cnt');
        Global.displays.order(orderDisplay);
        setTimeout(TwoDLayout.init, 1000);
        setTimeout(ThreeDMainModel.init, 1000);
    }
  } else if (urlSuffix === 'order') {
    require('./displays/canvas');
    const viewDisplayManager = new DisplayManager('display-cnt', 'main-display-menu');
    require('./displays/single-order');
    setTimeout(TwoDLayout.init, 1000);
    setTimeout(ThreeDMainModel.init, 1000);
  }
}

if (urlSuffix === 'template') Request.get(EPNTS.config.get(), init, console.error);
else init();

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

du.on.match('mousemove', '*', (elem, event) => {
  if (event.clientY < 20) {
    popUp.updateContent('Wait! un comment down');
    popUp.positionOnElement();
    popUp.show();
  } else {
    popUp.close();
  }
});

du.on.match('click', '.copy-inner-text', (elem) => {
  du.copy(elem.innerText);
});

const chevDisplay = (elem, hidden) => {
  if (hidden) du.class.add(elem, 'hidden');
  else du.class.remove(elem, 'hidden')
}

du.on.match('click', '.chev-dropdown-toggle', (elem) => {
  const dropdown = du.find.down('.chev-dropdown', elem.parentElement);
  const downChev = du.find.closest('.down', elem);
  const rightChev = du.find.closest('.right', elem);
  dropdown.hidden = !dropdown.hidden;
  chevDisplay(downChev, dropdown.hidden);
  chevDisplay(rightChev, !dropdown.hidden);
});

new QRious({
          element: document.getElementById('qr-demo'),
          value: 'https://github.com/neocotic/qrious',
          size: 100
        });

module.exports = {orderDisplay: () => orderDisplay};
