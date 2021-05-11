
let roomDisplay;
let order;
let propertyDisplay;

afterLoad.push(() => {
  order = new Order();
  orderDisplay = new OrderDisplay('#app');
  setTimeout(ThreeDModel.init, 1000);
  let propertyDisplay = new PropertyDisplay('#property-display');
  propertyDisplay.update(DEFAULT_PROPS);
});
