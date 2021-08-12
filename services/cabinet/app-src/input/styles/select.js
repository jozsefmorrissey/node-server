class Select extends Input {
  constructor(props) {
    super(props);
    const isArray = Array.isArray(props.list);
    let value;
    if (isArray) {
      value = props.index && props.list[props.index] ?
      props.list[props.index] : props.list[0];
      value = props.list.indexOf(props.value) === -1 ? props.list[0] : props.value;
    } else {
      const key = Object.keys(props.list)[0];
      value = props.value || key;
    }
    props.value = undefined;
    this.setValue(value);
    this.isArray = () => isArray;

    this.selected = (value) => value === this.value();
  }
}

Select.template = new $t('input/select');
Select.html = (instance) => () => Select.template.render(instance);

Select.costType = () => new Select({
  placeholder: 'Type',
  name: 'type',
  class: 'center',
  list: Cost.typeList
});

Select.method = () => new Select({
  name: 'method',
  class: 'center',
  list: Material.methodList,
});

Select.propertyConditions = () => new Select({
  name: 'propertyCondition',
  class: 'center',
  list: Object.values(ConditionalCost.conditions)
});

Select.propertyId = (name) => new Select({
  name: 'propertyId',
  class: 'center',
  list: Object.keys(properties.list),
  value: name
});

Select.company = () => new Select({
  name: 'company',
  label: 'Company',
  class: 'center',
  list: [''].concat(Object.keys(Company.list)),
  value: ''
});

Select.cost = (cost) => {
  const childIds = ['None'].concat(cost.children.map((obj) => obj.id()));
  return new Select({
    name: 'child',
    label: 'Default',
    class: 'center',
    list: childIds,
    value: cost.selectedId()
  })
};
