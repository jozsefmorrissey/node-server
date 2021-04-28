
let roomDisplay;
let order;

afterLoad.push(() => {
  order = new Order();
  roomDisplay = new RoomDisplay('#room-pills', order.rooms);
  const dummyText = (prefix) => (item, index) => `${prefix} ${index}`;
  // ThreeDModel.init();
  setTimeout(ThreeDModel.init, 1000);
});
