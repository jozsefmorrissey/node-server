
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

const normals = (assembly) => {
  let normObj, lastNormHash, lastNorm;
  const ensureVector = (cno, attr) => cno[attr].length === 2 ?
      cno[attr] = new Line3D(this.evalObject(cno[attr][0]), this.evalObject(cno[attr][1])).vector().unit() :
      (cno[attr] instanceof Vector3D ? cno[attr] :
        cno[attr] = new Vector3D(this.eval(cno[attr][0]), this.eval(cno[attr][1]), this.eval(cno[attr][2])).unit());

  const normFunc = (array, normalObj) => {
    if (normFunc.set(array, normalObj)) return normObj;
    if (!normObj) norms = normFunc.rotation();
    else if (normObj.DETERMINE_FROM_PARENT) return normObj;
    else if (normObj.DETERMINE_FROM_MODEL) return normObj;
    else if (normObj.DETERMINE_FROM_VECTOR) norms = normFunc.vector();

    return array ? [norms.x, norms.y, norms.z] : norms;
  }

  normFunc.set = (array, normalObj) => {
    if (normalObj instanceof Object) {
      const currHash = Object.hash(normalObj);
      if (lastNormHash !== currHash) {
        lastNormHash = currHash;
        if (!Array.isArray(normalObj)) normObj = normalObj;
        else normObj = {x: normalObj[0], y: normalObj[1], z: normalObj[2]};
        if (normObj.x || normObj.y) {
          normObj.DETERMINE_FROM_VECTOR = true;
          normObj.calc = normalObj.calc;
        }
      }
      return normObj;
    }
  }
  normFunc.raw = () => normObj;

  normFunc.vector = () => {
    const calcNormObj = assembly.evalObject(normObj);
    if (normObj.calc !== 0) ensureVector(calcNormObj, 'x');
    if (normObj.calc !== 1) ensureVector(calcNormObj, 'y');
    if (normObj.calc !== 2) ensureVector(calcNormObj, 'z');
    if (normObj.calc === 0) calcNormObj.x = calcNormObj.y.crossProduct(calcNormObj.z).unit();
    if (normObj.calc === 1) calcNormObj.y = calcNormObj.x.crossProduct(calcNormObj.z).unit();
    if (normObj.calc === 2) calcNormObj.z = calcNormObj.x.crossProduct(calcNormObj.y).unit();
    return calcNormObj;
  }

  normFunc.rotation = () => {
      const rotation = assembly.position().rotation();
      const normObj = {
          x: new Vertex3D(1,0,0).rotate(rotation).vector(),
          y: new Vertex3D(0,1,0).rotate(rotation).vector(),
          z: new Vertex3D(0,0,1).rotate(rotation).vector()
      };
      return normObj;
  }
  return normFunc;
}

function positionAssemblyCsg(csg, assembly) {
  csg = csg.clone();
  if (assembly.position) {
    const rotation = assembly.position().rotation();
    const buildCenter = assembly.buildCenter(true);
    const center = new Vertex3D(assembly.position().center());
    csg.translate({x: -buildCenter.x, y: -buildCenter.y, z: -buildCenter.z})
    csg.rotate(rotation);
    csg.translate(center);
  }
  return csg;
}

function positionAssemblyCsg(obj, assembly) {
  obj = obj.clone ? obj.clone() : obj.copy();;
  if (assembly.position) {
    const rotation = assembly.position().rotation();
    const buildCenter = assembly.buildCenter(true);
    const center = new Vertex3D(assembly.position().center());
    obj = obj.translate({x: -buildCenter.x, y: -buildCenter.y, z: -buildCenter.z}) || obj;
    obj = obj.rotate(rotation) || obj;
    obj = obj.translate(center) || obj;
  }
  return obj;
}

exports.normals = normals;
exports.formatConstructorId = formatConstructorId;
exports.getDefaultSize = getDefaultSize;
exports.positionAssemblyCsg = positionAssemblyCsg;
