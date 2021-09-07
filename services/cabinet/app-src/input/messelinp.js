//
// const MeasurementInput = require('../../../../public/js/utils/input/styles/measurement.js');
// const Cost = require('../cost/cost.js');
// const Select = require('../../../../public/js/utils/input/styles/select.js');
// const Material = require('../cost/types/material.js');
// const ConditionalCost = require('../cost/types/category/conditional.js');
// const Company = require('../objects/company.js');
// const Input = require('../../../../public/js/utils/input/input.js');
// const Property = require('../properties.js');
// const Cabinet = require('../objects/assembly/assemblies/cabinet.js');
// const Labor = require('../cost/types/material/labor.js');
//
// MeasurementInput.len = (value) => new MeasurementInput({
//   type: 'text',
//   placeholder: 'Length',
//   name: 'length',
//   class: 'center',
//   value
// });
// MeasurementInput.width = (value) => new MeasurementInput({
//   type: 'text',
//   label: 'x',
//   placeholder: 'Width',
//   name: 'width',
//   class: 'center',
//   value
// });
// MeasurementInput.depth = (value) => new MeasurementInput({
//   type: 'text',
//   label: 'x',
//   placeholder: 'Depth',
//   name: 'depth',
//   class: 'center',
//   value
// });
// MeasurementInput.cost = () => new MeasurementInput({
//   type: 'number',
//   label: '$',
//   placeholder: 'Cost',
//   name: 'cost'
//   value
// });
// MeasurementInput.pattern = (id, value) => new MeasurementInput({
//   type: 'text',
//   label: id,
//   value,
//   placeholder: id,
//   name: id,
//   class: 'pattern-input',
// });
//
// MeasurementInput.offsetLen = () => new MeasurementInput({
//   type: 'text',
//   label: 'Offset',
//   placeholder: 'Length',
//   name: 'offsetLength',
//   class: 'center',
// });
// MeasurementInput.offsetWidth = () => new MeasurementInput({
//   type: 'text',
//   label: 'x',
//   placeholder: 'Width',
//   name: 'offsetWidth',
//   class: 'center',
// });
// MeasurementInput.offsetDepth = () => new MeasurementInput({
//   type: 'text',
//   label: 'x',
//   placeholder: 'Depth',
//   name: 'offsetDepth',
//   class: 'center',
// });
//
//
// Select.costType = () => new Select({
//   placeholder: 'Type',
//   name: 'type',
//   class: 'center',
//   list: Cost.typeList
// });
//
// Select.method = () => new Select({
//   name: 'method',
//   class: 'center',
//   list: Material.methodList,
// });
//
// Select.propertyConditions = () => new Select({
//   name: 'propertyCondition',
//   class: 'center',
//   list: Object.values(ConditionalCost.conditions)
// });
//
// Select.propertyId = (name) => new Select({
//   name: 'propertyId',
//   class: 'center',
//   list: Object.keys(properties.list),
//   value: name
// });
//
// Select.company = () => new Select({
//   name: 'company',
//   label: 'Company',
//   class: 'center',
//   list: [''].concat(Object.keys(Company.list)),
//   value: ''
// });
//
// Select.cost = (cost) => {
//   const childIds = ['None'].concat(cost.children.map((obj) => obj.id()));
//   return new Select({
//     name: 'child',
//     label: 'Default',
//     class: 'center',
//     list: childIds,
//     value: cost.selectedId()
//   })
// };
//
//
// Input.id = () => new Input({
//   type: 'text',
//   placeholder: 'Id',
//   name: 'id',
//   class: 'center',
//   validation: /^\s*[^\s]{1,}\s*$/,
//   errorMsg: 'You must enter an Id'
// });
//
// Input.propertyId = () => new Input({
//   type: 'text',
//   placeholder: 'Property Id',
//   name: 'propertyId',
//   class: 'center',
//   validation: /^[a-zA-Z\.]{1}$/,
//   errorMsg: 'Alpha Numeric Value seperated by \'.\'.<br>I.E. Cabinet=>1/2 Overlay = Cabinet.12Overlay'
// });
//
// Input.propertyValue = () => new Input({
//   type: 'text',
//   placeholder: 'Property Value',
//   name: 'propertyValue',
//   class: 'center'
// });
//
// Input.CostId = () => new Input({
//   type: 'text',
//   placeholder: 'Id',
//   name: 'id',
//   class: 'center',
//   validation: (id, values) =>
//       id !== '' && (!values.referenceable || Object.values(Cost.defined).indexOf(id) === -1),
//   errorMsg: 'You must an Id: value must be unique if Referencable.'
// });
//
// Input.Name = () => new Input({
//   type: 'text',
//   placeholder: 'Name',
//   name: 'name',
//   class: 'center',
//   validation: /^\s*[^\s].*$/,
//   errorMsg: 'You must enter a Name'
// });
//
// Input.color = () => new Input({
//   type: 'color',
//   validation: /.*/,
//   placeholder: 'color',
//   name: 'color',
//   class: 'center'
// });
//
// Input.optional = () => new Input({
//   label: 'Optional',
//   name: 'optional',
//   type: 'checkbox',
//   default: false,
//   validation: [true, false],
//   targetAttr: 'checked'
// });
//
// Input.modifyDemension = () => new Input({
//   label: 'Modify Demension',
//   name: 'modifyDemension',
//   type: 'checkbox',
//   default: false,
//   validation: [true, false],
//   targetAttr: 'checked'
// });
//
// Input.partNumber = () => new Input({
//   label: 'Part Number',
//   name: 'partNumber',
//   type: 'text'
// });
//
// Input.count = (value) => new Input({
//   label: 'Count',
//   name: 'count',
//   type: 'number',
//   value: value || 1
// });
//
// Input.quantity = (value) => new Input({
//   label: 'Quantity',
//   name: 'quantity',
//   type: 'number',
//   value: value || 0
// });
//
// Input.hourlyRate = () => new Input({
//   label: 'Hourly Rate',
//   name: 'hourlyRate',
//   type: 'number',
// });
//
// Input.hours = (value) => new Input({
//   label: 'Hours',
//   name: 'hours',
//   type: 'number',
//   value: value || 0
// });
//
// Input.laborType = (type) => new Input({
//   name: 'laborType',
//   placeholder: 'Labor Type',
//   label: 'Type',
//   class: 'center',
//   clearOnClick: true,
//   list: Labor.types,
//   value: type
// });
//
// exports.MeasurementInput = MeasurementInput
// exports.Cost = Cost
// exports.Select = Select
// exports.Material = Material
// exports.ConditionalCost = ConditionalCost
// exports.Company = Company
// exports.Input = Input
// exports.Property = Property
// exports.Cabinet = Cabinet
// exports.Labor = Labor
//

exports.MeasurementInput = MeasurementInput
exports.Cost = Cost
exports.ConditionalCost = ConditionalCost
exports.Company = Company
exports.Input = Input
exports.Property = Property
exports.Cabinet = Cabinet
