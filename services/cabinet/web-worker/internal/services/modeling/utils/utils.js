
const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');

function updatePosition(position, assem, joint) {
  const direction = joint.centerAxis[0] === '-' ? -1 : 1;
  const centerAxis = joint.centerAxis[1].toLowerCase();
  const offset = joint.maleOffset;
  const demAxis = joint.demensionAxis.toLowerCase();
  position.demension[demAxis] = position.demension[demAxis] + offset;
  position.center[centerAxis] = position.center[centerAxis] + (offset/2 * direction);
};

function applyMaleJointExtensions(assem, env) {
  const position = assem.position.current;
  if (position.extApplied === true) throw new Error('this should only be called once');
  const maleJointIds = env.jointMap.male[assem.id] || [];
  const jointsToUpdate = maleJointIds.map(jid => env.byId[jid])
                              .filter(d => d.maleOffset);
  if (jointsToUpdate.length) {
    jointsToUpdate.forEach(j => updatePosition(position, assem, j));
  }
  position.extApplied = true;
}

function toBiPolygon(assem, env) {
  const current = assem.position.current;
  applyMaleJointExtensions(assem, env);
  return BiPolygon.fromPositionObject(current);
}

const vectObj = (obj) => new Vector3D(obj);
function normals(part, env) {
  let norms = part.position.current.normals;
  if (part.id.startsWith('PanelVoidIndex')) {
    norms = Polygon3D.normals(Polygon3D.fromCSG(env.modelInfo.model[part.id]));
  } else if (norms.DETERMINE_FROM_MODEL) {
    norms = Polygon3D.normals(Polygon3D.fromCSG(env.modelInfo.model[part.id]));
  } else if (norms.DETERMINE_FROM_PARENT !== undefined) {
    const parentNorms = normals(part.parentAssembly(), env);
    norms = parentNorms;
  } else if (part.id.startsWith('Panel_') && part.parentAssembly().id.startsWith('Divider_')) {
    normals(part.parentAssembly(), env);
  } else {
    norms.x = new Vector3D(norms.x); norms.y = new Vector3D(norms.y); norms.z = new Vector3D(norms.z);
  }
  return norms;
}

module.exports = {
  toBiPolygon, applyMaleJointExtensions, normals
}
