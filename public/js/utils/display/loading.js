
const PopUp = require('pop-up');

class LoadingDisplay {
  constructor(id) {
    const popup = new PopUp({backdropClose: false});
    this.id = () => id;
    let itteration = 0;
    let active = false;

    this.activate = () => {
      popup.open('Loading');
      active = true;
    }
    this.deactivate = () => {
      popup.close();
      active = false;
    }
  }
}

module.exports = LoadingDisplay;
