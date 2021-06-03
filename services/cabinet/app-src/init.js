
let roomDisplay;
let order;
let propertyDisplay;
let mainDisplayManager;

afterLoad.push(() => {
  order = new Order();
  orderDisplay = new OrderDisplay('#app');
  setTimeout(ThreeDModel.init, 1000);
  let propertyDisplay = new PropertyDisplay('#property-manager');
  propertyDisplay.update(DEFAULT_PROPS);
  mainDisplayManager = new DisplayManager('display-ctn', 'menu', 'menu-btn');
});
