class OrderDisplay {
  constructor(parentSelector, orders) {
    const roomDisplays = {};
    let active;
    const getHeader = (order, $index) =>
        OrderDisplay.headTemplate.render({order, $index});

    function initOrder(order) {
      roomDisplays[order.id] = new RoomDisplay('#room-pills', order);
      return order;
    }

    function loadOrder(index) {
      return function (orderData) {
        const order = Order.fromJson(orderData);
        console.log(order);
        initOrder(order);
        expandList.set(index, order);
      }
    }

    const getBody = (order, $index) => {
      if (order instanceof Order) {
        let propertyTypes = Object.keys(properties.list);
        active = roomDisplays[order.id];
        setTimeout(roomDisplays[order.id].refresh, 100);
        return OrderDisplay.bodyTemplate.render({$index, order, propertyTypes});
      } else {
        Request.get(EPNTS.order.get(order.name), loadOrder($index), console.error);
        return 'Loading...';
      }
    }
    const getObject = () => initOrder(new Order());
    this.active = () => active;

    const expListProps = {
      list: orders,
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Order', type: 'sidebar'
    };
    const expandList = new ExpandableList(expListProps);

    const saveSuccess = () => console.log('success');
    const saveFail = () => console.log('failure');
    const save = (target) => {
      const index = target.getAttribute('index');
      const order = expandList.get(index);
      Request.post(EPNTS.order.add(order.name), order.toJson(), saveSuccess, saveFail);
      console.log('saving');
    }

    const attrUpdate = (attr) => (target) => {
      const index = target.getAttribute('index');
      const order = expandList.get(index);
      order[attr] = target.value;
    };

    function addOrders(names) {
      names.forEach((name) => expListProps.list.push({ name }));
      expandList.refresh();
    }
    Request.get(EPNTS.order.list(), addOrders);

    matchRun('change', '.order-name-input', attrUpdate('name'));
    matchRun('click', '.save-order-btn', save);
  }
}
OrderDisplay.bodyTemplate = new $t('order/body');
OrderDisplay.headTemplate = new $t('order/head');
