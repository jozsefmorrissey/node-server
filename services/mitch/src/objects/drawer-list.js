
const Collection = require('../../../../public/js/utils/collections/collection');

class DrawerList {
  constructor() {
    const instance = this;
    const list = [];
    const byId = {};
    const uniqueId = String.random();
    this.uniqueId = () => uniqueId;


    this.add = (drawerBox) => {
      list.push(drawerBox);
      byId[drawerBox.id()];
    }

    const collectionMembers = ['style', 'finishing', 'sides', 'bottom', 'route', 'branding', 'notch', 'scoop'];
    this.collection = (drawerBox) =>
        Collection.create(collectionMembers, list);

  }
}

module.exports = DrawerList;
