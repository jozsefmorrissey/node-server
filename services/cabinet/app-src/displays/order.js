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

    function loadOrder(index, start) {
      return function (orderData) {
        const order = Order.fromJson(orderData);
        initOrder(order);
        expandList.set(index, order);
        expandList.refresh();
        console.log('load Time:', new Date().getTime() - start);
      }
    }

    const getBody = (order, $index) => {
      if (order instanceof Order) {
        let propertyTypes = Object.keys(properties.list);
        active = roomDisplays[order.id];
        return OrderDisplay.bodyTemplate.render({$index, order, propertyTypes});
      } else {
        const start = new Date().getTime();
        Request.get(EPNTS.order.get(order.name), loadOrder($index, start), console.error);
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
    expandList.afterRender(() => {if (active !== undefined) active.refresh()});

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
