


const Lookup = require('../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../public/js/utils/$t.js');
class RoomDisplay extends Lookup {
  constructor(parentSelector, order) {
    super();

    this.order = (ord) => {
      if (ord) {
        order = ord;
      }
      return order || Global.order();
    }

    this.html = () =>
      RoomDisplay.fileTemplate.render(order);
  }
}

RoomDisplay.fileTemplate = new $t('room/file');
module.exports = RoomDisplay
