const $t = require('../../../public/js/utils/$t.js');
$t.loadFunctions(require('../generated/html-templates'));
require('../../../public/js/utils/utils');
const du = require('../../../public/js/utils/dom-utils');
require('../../../public/js/utils/3d-modeling/csg.js');
const ThreeD = require('./3D');
const TwoD = require('./2D');

const input = du.find('textarea');

TwoD.oft(false)

const twoDDisplay = du.id('two-d-display');
const threeDDisplay = du.id('three-d-display');

let text2d = TwoD.initialValue;
let text3d = ThreeD.initialValue;

let parcer = du.find('[name="parcer"]:checked').value;
input.value = parcer === '3D' ? text3d : text2d;

const commentReg = /\s*\/\/.*/;
function clean(text) {
  return text.split('\n').map(l => l.replace(commentReg, '')).filter(l => l);
}

let lastHash;
let scale = 1;
function parse(elem, event) {
  if (event.type === 'refresh') lastHash = undefined;
  const thisHash = input.value.hash();
  const sc = Number.parseFloat(du.find('[name="scale"]').value || 1);
  if (lastHash !== thisHash || (sc !== scale)) {
    lastHash = thisHash;
    scale = sc;
    parcer === '2D' ? TwoD.parse(clean(text2d = input.value), scale) : ThreeD.parse(clean(text3d = input.value), scale);
  }
}

du.on.match('change', '[name="parcer"]', (elem, event) => {
  if (parcer === '2D') {
    text2d = input.value;
  } else {
    text3d = input.value;
  }
  // line =  line.replace(commentReg, '');
  parcer = elem.value;
  const is2D = parcer === '2D';
  const is3D = parcer === '3D';
  twoDDisplay.hidden = !is2D;
  threeDDisplay.hidden = !is3D;
  if (is2D) TwoD.parse(clean(input.value = text2d), scale);
  if (is3D) ThreeD.parse(clean(input.value = text3d), scale);
  TwoD.oft(is2D);
  ThreeD.oft(is3D);
});

du.on.match('keyup:refresh', 'textarea,[name="scale"]', parse);

console.log(parcer);
ThreeD.parse(clean(input.value), 1)
