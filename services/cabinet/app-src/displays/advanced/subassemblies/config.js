
const $t = require('../../../../../../public/js/utils/$t.js');
const du = require('../../../../../../public/js/utils/dom-utils.js');

du.on.match('change', '[radio-container] input[type=radio]', (elem) => {
  const displayCnts = Array.from(du.find.closest('[container]', elem).children);
  displayCnts.forEach(e => e.hidden = true);
  const target = displayCnts.find(e => du.class.has(e, `${elem.value}-cnt`));
  if (target) target.hidden = false;
});

function setConfigValue(elem, eval) {
  if (!eval && elem.hasAttribute('config-raw')) return;;
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  const configAttr = du.find.up.attribute('config-attr', elem);
  const config = assem.config.POSITION[configAttr];
  elem.value = eval ? Measurement.display(assem.eval(config[elem.name])) : config[elem.name];
  if (!eval) elem.setAttribute('config-raw', '');
  else elem.removeAttribute('config-raw');
}

const changeWidth = (elem, expand, shrink) => {
  const isExpanding = document.activeElement  === elem;
  const pxSize = isExpanding ? expand : shrink;
  let currentSize = Number.parseFloat(getComputedStyle(elem).width);
  let original = elem.getAttribute('original-width');
  if (!original) original = elem.setAttribute('original-width', `${elem.style.width}:${currentSize}`);
  let difference = pxSize - currentSize;
  if (Math.abs(difference) < 1) return false;
  elem.style.width = `${currentSize + difference * .015}px`;
  if (difference < 0) {
    const origSize = Number.parseFloat(original.split(':')[1]);
    if (origSize >= currentSize) {
      elem.style.width = original.split(':')[0];
      setConfigValue(elem, true);
      return false;
    }
  } else {
    const inputDispValCnt = du.id('input-display-value-cnt');
    const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
    const value = assem.eval(elem.value);
    inputDispValCnt.innerText = ' = ' + Measurement.display(value);
    du.move.relitive(inputDispValCnt, elem, 'center outer right');
  }
  return true;
}

du.on.match('focusin:focusout', '.subassembly-config-cnt input:not([type="radio"]):not([type="checkbox"])', (elem) => {
  if (!document.hasFocus()) return;
  setConfigValue(elem);
  changeWidth.periodic(25, elem, 400, 0);
});

du.on.match('keyup', '.subassembly-config-cnt input', (elem) => {
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  const configAttr = du.find.up.attribute('config-attr', elem);
  const x = du.closest('[name="x"]').value;
  const y = du.closest('[name="x"]').value;
  const z = du.closest('[name="x"]').value;
  assem.config.POSITION[configAttr].set(x,y,z)
});
