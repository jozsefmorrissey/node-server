
const {Vector3D, Vertex3D, Line3D} = require('../../../public/js/utils/canvas/three-d/lib.js');

const removeSuffixes = ['Part', 'Section'].join('|');
function formatConstructorId (obj) {
  return obj.constructor.name.replace(new RegExp(`(${removeSuffixes})$`), '');
}

function getDefaultSize(instance) {
  const constructorName = instance.constructor.name;
  if (constructorName === 'Cabinet') return {length: 24 * 2.54, width: 50*2.54, thickness: 21*2.54};
  return {length: 0, width: 0, thickness: 0};
}

const defaultConfig = () => {
  return {calc: 2, lines: [[[0,0,0],[1,0,0]],
            [[0,0,0],[0,1,0]],
            [[0,0,0],[0,0,1]]],
    vectors: [[1,0,0],[0,1,0],[0,0,1]]}
};

function positionAssemblyCsg(csg, assembly) {
  csg = csg.clone();
  if (assembly.position) {
    const rotation = assembly.rotation();
    const buildCenter = assembly.buildCenter(true);
    const center = new Vertex3D(assembly.center());
    csg.translate({x: -buildCenter.x, y: -buildCenter.y, z: -buildCenter.z})
    csg.rotate(rotation);
    csg.translate(center);
  }
  return csg;
}

function positionAssemblyCsg(obj, assembly) {
  obj = obj.clone ? obj.clone() : obj.copy();;
  if (assembly.position) {
    const rotation = assembly.rotation();
    const buildCenter = assembly.buildCenter(true);
    const center = new Vertex3D(assembly.center());
    obj = obj.translate({x: -buildCenter.x, y: -buildCenter.y, z: -buildCenter.z}) || obj;
    obj = obj.rotate(rotation) || obj;
    obj = obj.translate(center) || obj;
  }
  return obj;
}

exports.formatConstructorId = formatConstructorId;
exports.getDefaultSize = getDefaultSize;
exports.positionAssemblyCsg = positionAssemblyCsg;
