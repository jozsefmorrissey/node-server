



const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function getDefaultSize(instance) {
  const constructorName = instance.constructor.name;
  if (constructorName === 'Cabinet') return {length: 24 * 2.54, width: 50*2.54, thickness: 21*2.54};
  return {length: 0, width: 0, thickness: 0};
}

exports.formatConstructorId = formatConstructorId;
exports.getDefaultSize = getDefaultSize;
