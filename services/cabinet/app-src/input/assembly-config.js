
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils.js');
const Measurement = require('../../../../public/js/utils/measurement.js');
const Inputs = require('inputs');

class AssemblyConfigInput {
  constructor(cabinet) {
    const demSelect = Inputs('xyz', {label: 'Demension'});
    const centerSelect = Inputs('xyz', {label: 'Center'});
    const rotationSelect = Inputs('xyz', {label: 'Rotation'});
    const id = `assembly-config-input-${String.random()}`;
    this.id = () => id;

    const setSelect = (attr, target, select, notMeasurment) => {
      const selector = `#${id}>.sub-${attr}-cnt>[name='${attr}']`;
      const dispVal = () => {
        const value = cabinet.position()[attr](this[attr].target);
        return notMeasurment ? value : new Measurement(value).display();
      }
      select.on('change', (value, elem) => {
        this[attr].target = elem.value;
        const display = du.find.closest('.measurement-input', elem);
        display.value = dispVal();
        const input = du.find.closest(`[name='${attr}']`, elem);
        input.value =this[attr].eqn();
      });
      du.on.match('keyup', selector, (elem) => {
        const value = elem.value;
        const setFuncName = 'set' + attr.substring(0,1).toUpperCase() + attr.substring(1);
        cabinet.position()[setFuncName](this[attr].target, value);
        const display = du.find.closest('.measurement-input', elem);
        display.value = dispVal();
      });
      this[attr] = {
        target,
        eqn: () => cabinet.position().configuration()[attr][this[attr].target],
        html: () => select.html(),
        value: dispVal
      };
    }

    setSelect('demension', 'x', demSelect);
    setSelect('center', 'x', centerSelect);
    setSelect('rotation', 'x', rotationSelect, true);

    this.html = () => AssemblyConfigInput.template.render(this);
  }
}

AssemblyConfigInput.template = new $t('advanced/subassemblies/assembly-config');

module.exports = AssemblyConfigInput;
