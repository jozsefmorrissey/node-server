class Select extends Input {
  constructor(props) {
    super(props);
    this.value = props.index && props.list[props.index] ?
      props.list[props.index] : props.list[0];
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
