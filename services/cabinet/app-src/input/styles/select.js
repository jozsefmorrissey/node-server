class Select extends Input {
  constructor(props) {
    super(props);
    let value = props.index && props.list[props.index] ?
      props.list[props.index] : props.list[0];
    value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
    props.value = undefined;
    this.setValue(value);

    this.selected = (value) => value === this.value();
  }
}

Select.template = new $t('input/select');
Select.html = (instance) => () => Select.template.render(instance);

Select.type = () => new Select({
  placeholder: 'Type',
  name: 'type',
  class: 'center',
  list: Cost.typeList
});

Select.method = () => new Select({
  name: 'method',
  class: 'center',
  list: Cost.methodList,
});

Select.propertyId = (name) => new Select({
  name: 'propertyId',
  class: 'center',
  list: Object.keys(properties.list),
  value: name
});
