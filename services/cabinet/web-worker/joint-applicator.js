


class JointApplicator {
  constructor(joints) {

    function isMatch(selector, obj) {
      if ((typeof selector) === 'string') selector = new RegExp(`^${selector}(:.*|)$`);
      if (selector instanceof RegExp) {
        return obj.partCode().match(selector) || obj.locationCode().match(selector);
      }
      return obj === selector;
    }

    function getModels(selector, filter, joint) {
      const parent = joint.parentAssembly();
      if (parent === undefined) throw new Error(`You need to set parentAssembly for '${joint.toString()}'`);
      const joinable = parent.allAssemblies().filter(a => a.constructor.joinable);
      let models = [];
      const runFilter = filter instanceof Function;
      for (let index = 0; index < joinable.length; index++) {
        const male = joinable[index];
        try {
          if (male.includeJoints() && isMatch(selector, male) && (!runFilter || filter(male))) {
            const model = male.toModel();
            if (model !== undefined) {
              models.push(male.toModel());
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }
      return models;
    }

    this.maleModels = (filter) => getModels(maleJointSelector, filter, this);
    this.femaleModels = (filter) => getModels(femaleJointSelector, filter, this);

    this.maleModel = (filter) => {
      const models = this.maleModels(filter);
      let model = new CSG();
      for (let index = 0; index < models.length; index++) {
        model = model.union(models[index]);
      }
      return model;
    }

    this.apply = (informationObject) => {
      let m = informationObject.model;
      joints.forEach((joint) => {
        if (joint.apply() && isMatch(joint.maleJointSelector(), informationObject)) {
          try {
            const maleModel = joint.maleModel(joints.jointFilter); // toModel needs to be decoupled from assemblies
            const maleModelValid = m.polygons.length > 0 && maleModel && maleModel.polygons.length > 0;
            if (maleModelValid) {
              m = m.subtract(maleModel);
            }
          } catch (e) {
            console.error('Most likely caused by a circular joint reference',e);
          }
        }
      });
      return m;
    }
  }
}
