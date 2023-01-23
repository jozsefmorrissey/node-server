
const $t = require('../$t');
const du = require('../dom-utils');

//TODO: shoould remove datalist from input object... bigger fish
class DataList {
  constructor(input) {
    let list = [];
    const id = `data-list-${String.random()}`;
    this.id = () => id;
    this.list = () => list;
    this.getElem = () => {
      let elem = du.id(id);
      if (!elem)  elem = du.create.element('datalist', {id});
      du.find('body').append(elem);
      return elem;
    }
    this.update = () => {
      const elem = this.getElem();
      elem.innerHTML = DataList.template.render(this);
      const inputElem = input && input.get();
      if (inputElem) {
        inputElem.setAttribute('list', this.id());
      }
    }
    this.setList = (newList) => {
      if (!Array.isArray(newList) || newList.equals(list)) return
      list = newList;
      this.update();
    }
  }
}

DataList.template = new $t('input/data-list');

module.exports = DataList;
