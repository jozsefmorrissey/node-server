
let roomDisplay;
let order;

afterLoad.push(() => {
  order = new Order();
  orderDisplay = new OrderDisplay('#app');
  setTimeout(ThreeDModel.init, 1000);
});
