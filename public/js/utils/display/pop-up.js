const DragDropResize = require('./drag-drop');

class PopUp {
  constructor (props) {
    props = props || {}
    const instance = this;
    const htmlFuncs = {};
    let forceOpen = false;
    let lockOpen = false;
    let currFuncs, currElem;
    let canClose = false;

    const popupCnt = new DragDropResize(props);

    popupCnt.hide();

    this.position = () => popupCnt;
    this.positionOnElement = popupCnt.position;


    this.softClose = () => {
      if (!lockOpen) {
        instance.close();
      }
    }

    this.close = popupCnt.close;

    this.show = () => {
      popupCnt.show();
    };

    function getFunctions(elem) {
      let foundFuncs;
      const queryStrs = Object.keys(htmlFuncs);
      queryStrs.forEach((queryStr) => {
        if (elem.matches(queryStr)) {
          if (foundFuncs) {
            throw new Error('Multiple functions being invoked on one hover event');
          } else {
            foundFuncs = htmlFuncs[queryStr];
          }
        }
      });
      return foundFuncs;
    }

    function on(queryStr, funcObj) {
      if (htmlFuncs[queryStr] !== undefined) throw new Error('Assigning multiple functions to the same selector');
      htmlFuncs[queryStr] = funcObj;
    }
    this.on = on;

    this.onClose = popupCnt.onClose;

    function updateContent(html) {
      popupCnt.updateContent(html);
      if (currFuncs && currFuncs.after) currFuncs.after();
      return instance;
    }
    this.updateContent = updateContent;

    this.open = (html, positionOn) => {
      this.updateContent(html);
      popupCnt.position(positionOn);
      this.show();
    }

    this.container = popupCnt.container;
    this.hasMoved = popupCnt.hasMoved;
    this.lockSize = popupCnt.lockSize;
    this.unlockSize = popupCnt.unlockSize;

    document.addEventListener('click', this.forceClose);
  }
}

module.exports = PopUp;
