const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function getValue(code, obj) {
  if ((typeof obj) === 'object' && obj[code] !== undefined) return obj[code];
  return CONSTANTS[code].value;
}
$t.global('getValue', getValue, true);

function getDefaultSize(instance) {
  const constructorName = instance.constructor.name;
  if (constructorName === 'Cabinet') return {length: 24, width: 50, thickness: 21};
  return {length: 0, width: 0, thickness: 0};
}

function funcOvalue () {
  let attrs = {};
  for (let index = 0; index < arguments.length; index += 2) {
    const attr = arguments[index];
    const funcOval = arguments[index + 1];
    if ((typeof funcOval) === 'function') this[attr] = funcOval;
    else this[attr] = () => funcOval;
  }
}

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



du.on.match('change', '.open-orientation-radio,.open-division-input', updateDivisions);
