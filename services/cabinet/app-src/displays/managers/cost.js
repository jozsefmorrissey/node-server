

class CostManager extends AbstractManager {
  constructor(id, name) {
    super(id, name);
    this.getObject = (values) =>
      Cost.new(values.type, values.id, values.method, values.cost, values.length, values.width, values.depth);
    this.loadPoint = () => EPNTS.costs.get();
    this.savePoint = () => EPNTS.costs.save();
    this.fromJson = Cost.fromJson;
    this.Cost = Cost;
  }
}

new CostManager('cost-manager', 'cost');

CostManager.inputTree = (callback) => {
  const idTypeMethod = [Input.id(), Select.type(), Select.method()];

  const length = MeasurementInput.len();
  const width = MeasurementInput.width();
  const depth = MeasurementInput.depth();
  const cost = MeasurementInput.cost();
  const lengthCost = [length, cost];
  const lengthWidthCost = [length, width, cost];
  const lengthWidthDepthCost = [length, width, depth, cost];
  const color = [Input.color()];

  const decisionInput = new DecisionInputTree('cost',
    idTypeMethod, callback);

  decisionInput.addStates({
    lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color
  });

  decisionInput.then(`method:${Cost.methods.LINEAR_FEET}`)
        .jump('lengthCost');
  decisionInput.then(`method:${Cost.methods.SQUARE_FEET}`)
        .jump('lengthWidthCost');
  decisionInput.then(`method:${Cost.methods.CUBIC_FEET}`)
        .jump('lengthWidthDepthCost');
  decisionInput.then(`method:${Cost.methods.UNIT}`)
        .jump('cost');
  decisionInput.then('type:Material').jump('color');

  return decisionInput;
}

// class CostManager {
//   constructor(id, costs) {
//     costs = costs || [];
//     const parentSelector = `#${id}`;
//
//     const getHeader = (cost) => CostManager.headTemplate.render({cost, Cost});
//     const getBody = (cost) => CostManager.bodyTemplate.render({cost, Cost});
//
//     const getObject = (values) =>
//       Cost.new(values.type, values.id, values.method, values.cost, values.length, values.width, values.depth);
//
//     const inputValidation = (values) => {
//       const typeValid = Cost.typeList.indexOf(values.Type) !== -1;
//       const methodValid = Cost.methodList.indexOf(values.Method) !== -1;
//       const costValid = Number.isFinite(Cost.evaluator.eval(values.Cost));
//       const idValid = values.Id !== '';
//
//       const errors = {};
//       if (!idValid) errors.Id = 'You must enter an Id';
//       if (!typeValid) errors.Type = 'You must choose a valid Type';
//       if (!costValid) errors.Cost = 'You must enter a number for the cost';
//       if (!methodValid) {
//         errors.Method = 'You must choose a valid Method'
//         return errors;
//       }
//
//       let sizeValid;
//       const size = values.Size.toLowerCase();
//       switch (values.Method) {
//         case Cost.methods.LINEAR_FEET:
//           if (size.match(/\s*[0-9]{1,}\s*/)) break;
//           errors.Size = 'You must enter the length: [0-9]*';
//           return errors;
//         case Cost.methods.SQUARE_FEET:
//           if (size.match(/\s*[0-9]{1,}\s*x\s*[0-9]{1,}\s*/)) break;
//           errors.Size = 'You must enter the length: [0-9]*x[0-9]*';
//           return errors;
//         case Cost.methods.CUBIC_FEET:
//           if (size.match(/\s*[0-9]{1,}\s*x\s*[0-9]{1,}\s*x\s*[0-9]{1,}\s*/)) break;
//           errors.Size = 'You must enter the length: [0-9]*x[0-9]*x[0-9]*';
//           return errors;
//         case Cost.methods.UNIT:
//           if (size === '') break;
//           errors.Size = 'For clarity sake: Size should not be defined for Unit costs';
//           return errors;
//         default:
//           errors.Size = 'Unkown Size Error';
//       }
//
//       return Object.keys(errors).length === 0 ? true : errors;
//     };
//
//     const expListProps = {
//       list: costs,
//       inputTree: CostManager.inputTree(console.log),
//       parentSelector, getHeader, getBody, getObject,
//       listElemLable: 'Cost'
//     };
//     const expandList = new ExpandableList(expListProps);
//
//     const saveSuccess = () => console.log('success');
//     const saveFail = () => console.log('failure');
//     const save = (target) => {
//       const body = Cost.toJson(costs);
//       Request.post(EPNTS.costs.save(), body, saveSuccess, saveFail);
//       console.log('saving');
//     }
//
//     matchRun('click', '#cost-manager-save-btn', save);
//   }
// }
//
// CostManager.bodyTemplate = new $t('managers/cost/body');
// CostManager.headTemplate = new $t('managers/cost/header');
// CostManager.inputTree = (callback) => {
//   const idTypeMethod = [Input.id(), Select.type(), Select.method()];
//
//   const length = MeasurementInput.len();
//   const width = MeasurementInput.width();
//   const depth = MeasurementInput.depth();
//   const cost = MeasurementInput.cost();
//   const lengthCost = [length, cost];
//   const lengthWidthCost = [length, width, cost];
//   const lengthWidthDepthCost = [length, width, depth, cost];
//   const color = [Input.color()];
//
//   const decisionInput = new DecisionInputTree('cost',
//     idTypeMethod, callback);
//
//   decisionInput.addStates({
//     lengthCost, lengthWidthCost, lengthWidthDepthCost, cost, color
//   });
//
//   decisionInput.then(`method:${Cost.methods.LINEAR_FEET}`)
//         .jump('lengthCost');
//   decisionInput.then(`method:${Cost.methods.SQUARE_FEET}`)
//         .jump('lengthWidthCost');
//   decisionInput.then(`method:${Cost.methods.CUBIC_FEET}`)
//         .jump('lengthWidthDepthCost');
//   decisionInput.then(`method:${Cost.methods.UNIT}`)
//         .jump('cost');
//   decisionInput.then('type:Material').jump('color');
//
//   return decisionInput;
// }
//
// afterLoad.push(() => {
//   function loadCosts(costsJson) {
//     const costs = Cost.fromJson(costsJson);
//     console.log('loading costs');
//     new CostManager('cost-manager-body', costs);
//   }
//   Request.get(EPNTS.costs.get(), loadCosts);
// });
