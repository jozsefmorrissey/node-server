
const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');

du.on.match('change', '[radio-container] input[type=radio]', (elem) => {
  const displayCnts = Array.from(du.find.closest('[container]', elem).children);
  displayCnts.forEach(e => e.hidden = true);
  const target = displayCnts.find(e => du.class.has(e, `${elem.value}-cnt`));
  if (target) target.hidden = false;
})
