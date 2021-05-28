class MeasurementInput extends Input {
  constructor(props) {
    super(props);
    props.validation = (value) => typeof MeasurementInput.evaluator.eval(value) === 'number';
    props.errorMsg = 'Invalid Mathematical Expression';
  }
}

MeasurementInput.template = new $t('input/measurement');
MeasurementInput.html = (instance) => () => MeasurementInput.template.render(instance);
MeasurementInput.evaluator = new StringMathEvaluator(Math);

MeasurementInput.len = () => new MeasurementInput({
  type: 'text',
  placeholder: 'Length',
  name: 'size',
  class: 'center',
});
MeasurementInput.width = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Width',
  name: 'size',
  class: 'center',
});
MeasurementInput.depth = () => new MeasurementInput({
  type: 'text',
  label: 'x',
  placeholder: 'Depth',
  name: 'size',
  class: 'center',
});
MeasurementInput.cost = () => new MeasurementInput({
  type: 'number',
  label: '$',
  placeholder: 'Cost',
  name: 'cost'
});
