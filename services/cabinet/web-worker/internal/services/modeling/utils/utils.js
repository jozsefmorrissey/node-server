
const {BiPolygon, Vector3D, Polygon3D, Layer} =
    require('../../../../../../../public/js/utils/canvas/three-d/lib');
const RDTO = require('../../../../shared/reconnect-transfer-object.js');
const JointSettings = require('../../../../shared/settings.js');


function toBiPolygon(assem, env) {
  if (Array.isArray(assem.position.current.points)) {
    const poly = new Polygon3D(assem.position.current.points);
    const biPoly = BiPolygon.fromPolygon(poly, 0, assem.position.current.thickness);
    return biPoly;
  }
  const current = assem.position.current;
  if (assem.width) current.demension.x = assem.width;
  if (assem.height) current.demension.y = assem.height;
  if (assem.thickness) current.demension.z = assem.thickness;
  const dems = current.demension;
    if (Math.min(dems.x, dems.y, dems.z) > .001) return BiPolygon.fromPositionObject(current);
  return null;
}

const vectObj = (obj) => new Vector3D(obj);
function normals(part, env) {
  let norms = part.position ? part.position.current.normals : {DETERMINE_FROM_MODEL: true};
  if (norms === undefined) return {x: Vector3D.i, y: Vector3D.j, z: Vector3D.k}
  if (norms.DETERMINE_FROM_MODEL) {
    const model = env.getModel(part, 'cut');
    if (!model.normals) {
      model.normals = Layer.normals(env.getModel(part, 'cut'));
    }
    return model.normals;
  } else if (norms.DETERMINE_FROM_PARENT !== undefined) {
    const parentNorms = normals(part.parentAssembly(), env);
    norms = parentNorms;
  } else if (part.id.startsWith('Panel_') && part.parentAssembly().id.startsWith('Divider_')) {
    return normals(part.parentAssembly(), env);
  } else {
    norms.x = new Vector3D(norms.x); norms.y = new Vector3D(norms.y); norms.z = new Vector3D(norms.z);
  }
  return norms;
}

function property(path, assem, env) {
  let target = assem;
  while(target) {
    if (target.values) {
      const value = Object.pathValue(target.values, path);
      if (value !== undefined) return value;
    }
    target = target.parentAssembly && target.parentAssembly();
  }
  let value = Object.pathValue(env.propertyConfig, path)
  return value;
}

property.set = (assem, env, ...setNameOpropName) => {
    const set = {};
    setNameOpropName.forEach(sOp => {
      const target = property(sOp, assem, env);
      if (!Array.isArray(target)) set[sOp] = target;
      else {
        target.forEach(p => set[p] = property(p, assem, env));
      }
    });
    return set;
}

const generated = (assem, env, model, idPrefix, parent) => {
  parent ||= Object.values(env.byId).find(a => a.find).find.root();
  assem.id ||= `${idPrefix || 'Generated'}_${String.random()}`;
  assem.partCode ||= `Gen:${String.random(4)}`;
  assem.locationCode ||= `${parent.locationCode}_${assem.partCode}`;
  assem.parentAssembly ||= {id: parent.id};
  assem.generated = true;
  env.modelInfo.model[assem.id] = model;
  env.generated.push(assem.id);
  assem.jointSettings ||= new JointSettings().toJson();
  return RDTO(assem, env.byId);
}

module.exports = {
  toBiPolygon, normals, property, generated
}
