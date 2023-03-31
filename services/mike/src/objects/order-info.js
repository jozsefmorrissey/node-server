
const DrawerList = require('./drawer-list');

class OrderInfo {
  constructor() {
    this.defaultGetterValue = () => '';
    Object.getSet(this, 'jobName', 'todaysDate', 'dueDate', 'companyName',
    'shippingAddress', 'billingAddress', 'phone', 'fax', 'salesRep', 'email',
    'shipVia', 'invoiceNumber', 'poNumber');

    const drawerList = new DrawerList();
    this.todaysDate(new Date().toISOString().split('T')[0]);

    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    this.dueDate(twoWeeks.toISOString().split('T')[0]);

    this.invoiceNumber(String.random());

    const drawerMap = {};
    this.drawerList = () => drawerList;

  }
}

module.exports = OrderInfo;
