class CostManager {
  constructor(id, costs) {
    costs = costs || [];
    const parentSelector = `#${id}`;
    const template = new $t('managers/cost');
    document.getElementById(id).innerHTML = template.render({Cost});

    const getHeader = (cost) => CostManager.headTemplate.render({cost, Cost});
    const getBody = (cost) => CostManager.bodyTemplate.render({cost, Cost});

    const getObject = (values) =>
      Cost.new(values.Type, values.Id, values.Method, values.Size, values.Cost);

    const inputValidation = (values) => {
      const typeValid = Cost.typeList.indexOf(values.Type) !== -1;
      const methodValid = Cost.methodList.indexOf(values.Method) !== -1;
      const costValid = Number.isFinite(Cost.evaluator.eval(values.Cost));
      const idValid = values.Id !== '';

      const errors = {};
      if (!idValid) errors.Id = 'You must enter an Id';
      if (!typeValid) errors.Type = 'You must choose a valid Type';
      if (!costValid) errors.Cost = 'You must enter a number for the cost';
      if (!methodValid) {
        errors.Method = 'You must choose a valid Method'
        return errors;
      }

      let sizeValid;
      const size = values.Size.toLowerCase();
      switch (values.Method) {
        case Cost.methods.LINEAR_FEET:
          if (size.match(/\s*[0-9]{1,}\s*/)) break;
          errors.Size = 'You must enter the length: [0-9]*';
          return errors;
        case Cost.methods.SQUARE_FEET:
          if (size.match(/\s*[0-9]{1,}\s*x\s*[0-9]{1,}\s*/)) break;
          errors.Size = 'You must enter the length: [0-9]*x[0-9]*';
          return errors;
        case Cost.methods.CUBIC_FEET:
          if (size.match(/\s*[0-9]{1,}\s*x\s*[0-9]{1,}\s*x\s*[0-9]{1,}\s*/)) break;
          errors.Size = 'You must enter the length: [0-9]*x[0-9]*x[0-9]*';
          return errors;
        case Cost.methods.UNIT:
          if (size === '') break;
          errors.Size = 'For clarity sake: Size should not be defined for Unit costs';
          return errors;
        default:
          errors.Size = 'Unkown Size Error';
      }

      return Object.keys(errors).length === 0 ? true : errors;
    };

    const expListProps = {
      list: costs,
      inputs: [{placeholder: 'Id'},
                {placeholder: 'Type', autofill: Cost.typeList},
                {placeholder: 'Method', autofill: Cost.methodList},
                {placeholder: 'Size'},
                {placeholder: 'Cost'}],
      parentSelector, getHeader, getBody, getObject, inputValidation,
      listElemLable: 'Cost'
    };
    const expandList = new ExpandableList(expListProps);

    const saveSuccess = () => console.log('success');
    const saveFail = () => console.log('failure');
    const save = (target) => {
      const body = Cost.toJson(costs);
      Request.post(EPNTS.costs.save(), body, saveSuccess, saveFail);
      console.log('saving');
    }

    matchRun('click', '#cost-manager-save-btn', save);
  }
}

CostManager.bodyTemplate = new $t('managers/cost/body');
CostManager.headTemplate = new $t('managers/cost/header');

afterLoad.push(() => {
  function loadCosts(costsJson) {
    const costs = Cost.fromJson(costsJson);
    console.log('loading costs');
    new CostManager('cost-manager-body', costs);
  }
  Request.get(EPNTS.costs.get(), loadCosts);
});
