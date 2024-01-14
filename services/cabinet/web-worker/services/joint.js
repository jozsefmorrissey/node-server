
function isMatch(partCodeOlocationCodeOassemblyOregexOfunc, dto) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  if (pclcarf instanceof Function) return pclcarf(dto) === true;
  if ((typeof pclcarf) === 'string') pclcarf = new RegExp(`^${pclcarf}(:.*|)$`);
  if (pclcarf instanceof RegExp) {
    return null !== (dto.partCode().match(pclcarf) || dto.locationCode().match(pclcarf));
  }
  return dto === pclcarf;
}

const matchFilter = (pclcarf, filter) => {
  const runFilter = filter instanceof Function;
  return (a) => {
    return a.constructor.joinable && a.includeJoints() && isMatch(pclcarf, a) && (!runFilter || filter(a));
  }
}

function getMatches (partCodeOlocationCodeOassemblyOregexOfunc, filter, allAssemblies) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  return allAssemblies.filter(matchFilter(pclcarf, filter));
}

function getModels(partCodeOlocationCodeOassemblyOregexOfunc, filter, allAssemblies) {
  let pclcarf = partCodeOlocationCodeOassemblyOregexOfunc;
  const joinable = getMatches(pclcarf, filter, joinallAssembliest);
  let models = [];
  for (let index = 0; index < joinable.length; index++) {
    const assem = joinable[index];
    try {
      const model = assem.toModel();
      if (model !== undefined) {
        models.push(assem.toModel());
      }
    } catch (e) {
      console.warn(e);
    }
  }
  return models;
}

const models = (filter) => getModels(maleJointSelector, filter, this);

const model = (filter) => {
  if (parent === undefined) throw new Error(`You need to set parentAssembly for '${this.toString()}'`);
  const models = this.maleModels(filter);
  let model = new CSG();
  for (let index = 0; index < models.length; index++) {
    model = model.union(models[index]);
  }
  return model;
}

function apply(model, joints, modelMap) {
  if (!joints || !Array.isArray(joints)) return model;
  let m = model; // preventCouruption
  joints.forEach((joint) => {
    if (joint.apply()) {
      try {
        const maleModel = joint.maleModel(joints.jointFilter);
        if (m.polygons.length > 0 && maleModel && maleModel.polygons.length > 0) {
          m = m.subtract(maleModel);
        }
      } catch (e) {
        console.error('Most likely caused by a circular joint reference',e);
      }
    }
  });
  return m;
}


module.exports = {apply, getMatches, getModels, isMatch, models, model};
