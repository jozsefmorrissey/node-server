
let roomDisplay;
let order;
let propertyDisplay;
let mainDisplayManager;

afterLoad.push(() => {
  order = new Order();
  orderDisplay = new OrderDisplay('#app');
  setTimeout(ThreeDModel.init, 1000);
  propertyDisplay = new PropertyDisplay('#property-manager');
  mainDisplayManager = new DisplayManager('display-ctn', 'menu', 'menu-btn');
});
