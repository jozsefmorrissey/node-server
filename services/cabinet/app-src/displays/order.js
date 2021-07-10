class OrderDisplay {
  constructor(parentSelector, orders) {
    const roomDisplays = {};
    let active;
    const getHeader = (order, $index) =>
        OrderDisplay.headTemplate.render({order, $index});

    const setInfo = (order, index) => () => {
      const elem = document.getElementById(`uf-info-${index}`);
      if (elem)
        UTF.buildDisplay(elem, new UFObj(order));
    }

    function initOrder(order, index) {
      roomDisplays[order.id] = new RoomDisplay('#room-pills', order);
      ToggleDisplayList.onShow(`information-display-${index}`, );
      expandList.afterRender(setInfo(order, index));
      return order;
    }

    function loadOrder(index, start) {
      return function (orderData) {
        const order = Order.fromJson(orderData);
        initOrder(order, index);
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
    const getObject = (values) => initOrder(new Order(values.name));
    this.active = () => active;

    const expListProps = {
      list: orders,
      inputs: [{placeholder: 'name'}],
      inputValidation: (values) => values.name ? true :
          'You must Define a name',
      parentSelector, getHeader, getBody, getObject,
      listElemLable: 'Order', type: 'sidebar',
      inputTree: new DecisionInputTree('Order', Input.Name(), console.log)
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
OrderDisplay.builderBodyTemplate = new $t('order/builder/body');
OrderDisplay.builderHeadTemplate = new $t('order/builder/head');
OrderDisplay.infoBodyTemplate = new $t('order/information/body');
OrderDisplay.infoHeadTemplate = new $t('order/information/head');
