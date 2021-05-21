class Select extends Input {
  constructor(props) {
    super(props)
  }
}

Select.template = new $t('input/select');
Select.html = (instance) => () => Select.template.render(instance);

// afterLoad.push(() =>
// document.body.innerHTML = new Select({
//   type: 'select',
//   name: 'var',
//   class: 'center',
//   list: {one: 1, two: 2, three: 3, four: 4},
//   validation: /^[1-3]$/,
//   errorMsg: 'you know you fucked up right?'
// }).html()
// );
