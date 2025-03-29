const du = require('../../../../../public/js/utils/dom-utils');
const $t = require('../../../../../public/js/utils/$t');
const Lookup = require('../../../../../public/js/utils/object/lookup');
const Canvas = require('../canvas');

du.on.match('change', '[prop-input]', (elem) => {
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  assem.value(elem.name, elem.value);
});

let change = false;
const renderView = () =>
  change && Canvas.view().render();
Global.on.change.cabinet(() => change = true);
Canvas.on.switch.before(renderView);

du.on.match('blur:enter', '[lookup-id] .xyz-input[set-name] input', renderView);


const advancedTemplate = new $t('advanced/template');
function buildAdvancedDropdown(elem) {
  const div = du.create.element('div');
  div.innerHTML = advancedTemplate.render({label: elem.getAttribute('advanced-dropdown')});
  const rendered = div.children[0];
  elem.removeAttribute('advanced-dropdown');
  rendered.children[1].append(elem.cloneNode(true));
  elem.replaceWith(rendered);
}

du.on.match('create', '[advanced-dropdown]', buildAdvancedDropdown);


du.on.match('change', '[radio-container] input[type=radio]', (elem) => {
  const displayCnts = Array.from(du.find.closest('[container]', elem).children);
  displayCnts.forEach(e => e.hidden = true);
  const target = displayCnts.find(e => du.class.has(e, `${elem.value}-cnt`));
  if (target) target.hidden = false;
})

let inputDispValCnt;
du.on.match('keyup:focusin:focusout', '[input-display-value] input:not([type="radio"]):not([type="checkbox"])', (elem) => {
  if (document.activeElement  !== elem) return inputDispValCnt.hidden = true;
  if (!inputDispValCnt) {
    inputDispValCnt = du.create.element('div', {id: 'input-display-value-cnt', class: 'card'});
    document.body.append(inputDispValCnt);
  }
  inputDispValCnt.hidden = false;
  console.log(elem);
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  const value = assem.eval(elem.value);
  if (Number.isNaN(value)) {
    du.class.add(inputDispValCnt, 'error');
    du.class.add(elem, 'error');
    inputDispValCnt.innerText = ' = ????';
  } else {
    du.class.remove(inputDispValCnt, 'error');
    du.class.remove(elem, 'error');
    inputDispValCnt.innerText = ' = ' + Measurement.display(value);
  }
  du.move.relitive(inputDispValCnt, elem, 'center outer right')
})
